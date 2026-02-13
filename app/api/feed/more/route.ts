import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import { generateLessonsFromText } from "@/lib/ai";
// @ts-ignore - Dynamic import to avoid circular dependency issues during build
import { lastExtractedText } from "@/app/api/upload/route";
const yts = require("yt-search");

export async function GET() {
    // In a real app, you'd fetch this from a DB using a session ID
    // Here we use the in-memory variable from the upload route
    if (!lastExtractedText || lastExtractedText.length < 50) {
        return NextResponse.json({ error: "No PDF context found. Please upload a file first." }, { status: 400 });
    }

    try {
        // Generate MORE lessons
        // The AI is naturally non-deterministic, so calling it again produces new results
        const lessons = await generateLessonsFromText(lastExtractedText);

        // Enhance video lessons with real YouTube URLs (same logic as upload)
        for (const lesson of lessons) {
            if (lesson.type === "video" && lesson.videoUrl?.startsWith("SEARCH:")) {
                const query = lesson.videoUrl.replace("SEARCH:", "").trim();
                try {
                    const searchResults = await yts(query);
                    // Find a video < 4 minutes
                    const video = searchResults.videos.find((v: any) => v.seconds < 240);
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

        // Persist new lessons to database
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

        return NextResponse.json(savedLessons);
    } catch (error) {
        console.error("Failed to generate more lessons:", error);
        return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
    }
}
