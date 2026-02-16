import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import pdf from "pdf-parse";
import { AIServiceError, generateLessonsFromText } from "@/lib/ai";
import { auth, prisma } from "@/lib/auth";
import yts from "yt-search";

const FREE_MAX_FILE_SIZE_MB = 60;
const PRO_MAX_FILE_SIZE_MB = 200;

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

    // Generate micro-lessons using OpenAI
    const lessons = await generateLessonsFromText(extractedText);

    // Replace video placeholders with real YouTube URLs
    for (const lesson of lessons) {
      if (lesson.type === "video" && lesson.videoUrl?.startsWith("SEARCH:")) {
        const query = lesson.videoUrl.replace("SEARCH:", "").trim();
        try {
          const searchResults = await yts(query);
          const video = searchResults.videos.find((v: any) => v.seconds < 240); // < 4 min
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
    }

    // Store for feed endpoint - persisted in DB
    await prisma.sourceMaterial.create({
      data: {
        content: extractedText,
      },
    });

    // Persist lessons to database
    const savedLessons = await Promise.all(
      lessons.map(async (lesson) =>
        prisma.lesson.create({
          data: {
            type: lesson.type,
            content: lesson.content,
            videoUrl: lesson.videoUrl,
            options: lesson.options || [],
            correctAnswer: lesson.correctAnswer,
            explanation: lesson.explanation,
          },
        })
      )
    );

    // Increment upload count
    await prisma.user.update({
      where: { id: user.id },
      data: { uploadCount: { increment: 1 } }
    });

    return NextResponse.json({ lessons: savedLessons, pageCount: pdfData.numpages });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    if (error instanceof AIServiceError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to process PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
