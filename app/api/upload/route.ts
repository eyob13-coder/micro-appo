import { NextRequest, NextResponse } from "next/server";
let pdf: any = require("pdf-parse");
// Handle double-default or module.exports.default wrapping in some environments
if (typeof pdf !== 'function' && pdf.default) {
    pdf = pdf.default;
}
import { generateLessonsFromText } from "@/lib/ai";

const yts = require("yt-search");

import { prisma } from "@/lib/auth";

// In-memory store for generated lessons (per-session, resets on server restart)
// In production, you'd store these in the database
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

        // Convert File to Buffer for pdf-parse
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

        // Generate micro-lessons with AI
        const lessons = await generateLessonsFromText(extractedText);

        // Enhance video lessons with real YouTube URLs
        for (const lesson of lessons) {
            if (lesson.type === "video" && lesson.videoUrl?.startsWith("SEARCH:")) {
                const query = lesson.videoUrl.replace("SEARCH:", "").trim();
                try {
                    const searchResults = await yts(query);
                    // Find a video < 4 minutes (240 seconds)
                    const video = searchResults.videos.find((v: any) => v.seconds < 240);
                    if (video) {
                        lesson.videoUrl = video.url;
                        lesson.content = video.title; // Update title to match video
                    } else {
                        // Fallback: use the first result regardless of length if no short video found
                        lesson.videoUrl = searchResults.videos[0]?.url || "";
                    }
                } catch (e) {
                    console.error(`Failed to search video for query "${query}":`, e);
                    lesson.videoUrl = ""; // Clear invalid URL
                }
            }
        }

        // Store for the feed endpoint
        lastExtractedText = extractedText;

        // Persist lessons to database
        const savedLessons = await Promise.all(lessons.map(async (lesson) => {
            return await prisma.lesson.create({
                data: {
                    type: lesson.type,
                    content: lesson.content,
                    videoUrl: lesson.videoUrl,
                    options: lesson.options || [],
                    correctAnswer: lesson.correctAnswer,
                    explanation: lesson.explanation
                }
            });
        }));

        return NextResponse.json({ lessons: savedLessons, pageCount: pdfData.numpages });
    } catch (error: unknown) {
        console.error("Upload error:", error);
        const message = error instanceof Error ? error.message : "Failed to process PDF";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
