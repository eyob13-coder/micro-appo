import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import pdf from "pdf-parse";
import { AIServiceError, generateLessonsFromText } from "@/lib/ai";
import { auth, prisma } from "@/lib/auth";
import yts from "yt-search";
import { splitPdfTextIntoChunks } from "@/lib/pdf-sequence";

const FREE_MAX_FILE_SIZE_MB = 60;
const PRO_MAX_FILE_SIZE_MB = 200;
const inflightUploads = new Map<string, ReturnType<typeof generateLessonsFromText>>();

export async function POST(request: NextRequest) {
  try {
    // 1. Auth & Limits Check
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const hasGoogleAuth = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "google",
      },
      select: { id: true },
    });

    if (!hasGoogleAuth) {
      return NextResponse.json(
        {
          error: "Google authentication required. Please sign in with Google before uploading a PDF.",
          requireGoogleAuth: true,
        },
        { status: 403 }
      );
    }

    // Fetch fresh user data to ensure accurate upload count
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Check Limits (3 for free, unlimited for Pro)
    if (!user.isPro && user.uploadCount >= 3) {
      return NextResponse.json({
        error: "Free limit reached (3 uploads). Upgrade to Pro for unlimited uploads.",
        limitReached: true
      }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    const maxFileSizeMb = user.isPro ? PRO_MAX_FILE_SIZE_MB : FREE_MAX_FILE_SIZE_MB;
    const maxBytes = maxFileSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error: `File size too large. Max limit is ${maxFileSizeMb}MB for your plan.`,
          fileTooLarge: true,
          maxFileSizeMb,
        },
        { status: 413 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    const pdfData = await pdf(buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json(
        { error: "PDF appears to be empty or contains too little text" },
        { status: 400 }
      );
    }

    const source = await prisma.sourceMaterial.create({
      data: {
        content: extractedText,
        userId: session.user.id,
      },
    });

    const chunks = splitPdfTextIntoChunks(extractedText);
    const firstChunk = chunks[0] ?? extractedText;

    // Generate micro-lessons with in-flight dedupe (prevents duplicate parallel uploads from same user/file)
    const uploadKey = `${session.user.id}:${file.name}:${file.size}:${file.lastModified}`;
    let generationPromise = inflightUploads.get(uploadKey);
    if (!generationPromise) {
      generationPromise = generateLessonsFromText(firstChunk);
      inflightUploads.set(uploadKey, generationPromise);
    }
    let lessons;
    try {
      lessons = await generationPromise;
    } finally {
      inflightUploads.delete(uploadKey);
    }

    // Replace video placeholders with real YouTube URLs in parallel to reduce total latency
    await Promise.all(
      lessons.map(async (lesson) => {
        if (lesson.type === "video" && lesson.videoUrl?.startsWith("SEARCH:")) {
          const query = lesson.videoUrl.replace("SEARCH:", "").trim();
          try {
            const searchResults = await yts(query);
            const video = searchResults.videos.find((v: { seconds: number }) => v.seconds < 240); // < 4 min
            if (video) {
              lesson.videoUrl = video.url;
              lesson.content = video.title;
            } else {
              lesson.videoUrl = searchResults.videos[0]?.url || "";
            }
          } catch (e) {
            console.error(`Failed to search video for query "${query}":`, e);
            lesson.videoUrl = "";
          }
        }
      })
    );

    // Persist lessons to database
    const savedLessons = await Promise.all(
      lessons.map(async (lesson, idx) =>
        prisma.lesson.create({
          data: {
            sourceMaterialId: source.id,
            type: lesson.type,
            content: lesson.content,
            videoUrl: lesson.videoUrl,
            options: lesson.options || [],
            correctAnswer: lesson.correctAnswer,
            explanation: lesson.explanation,
            chunkIndex: 0,
            sequence: idx + 1,
          },
        })
      )
    );

    // Increment upload count
    await prisma.user.update({
      where: { id: user.id },
      data: { uploadCount: { increment: 1 } }
    });

    return NextResponse.json({
      lessons: savedLessons,
      pageCount: pdfData.numpages,
      sourceId: source.id,
      nextChunkIndex: 1,
      hasMore: chunks.length > 1,
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    if (error instanceof AIServiceError) {
      const retryHint = error.retryAfterSeconds ? ` Retry in about ${error.retryAfterSeconds}s.` : "";
      const normalizedMessage =
        error.status === 429
          ? `AI quota exceeded.${retryHint} Please add billing/credits or try again later.`
          : error.message;

      return NextResponse.json(
        {
          error: normalizedMessage,
          code: error.code,
          retryAfterSeconds: error.retryAfterSeconds,
          quotaExceeded: error.status === 429 || error.status === 402,
        },
        { status: error.status }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to process PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
