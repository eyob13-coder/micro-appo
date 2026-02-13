import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import { generateLessonsFromText } from "@/lib/ai";
import { prisma } from "@/lib/auth";

const yts = require("yt-search");

// In-memory store for last extracted text (per-session)
let lastExtractedText: string = "";
export { lastExtractedText };

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
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

    // Store for feed endpoint
    lastExtractedText = extractedText;

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

    return NextResponse.json({ lessons: savedLessons, pageCount: pdfData.numpages });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Failed to process PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
