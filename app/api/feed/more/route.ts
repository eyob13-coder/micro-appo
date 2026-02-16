import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import { generateLessonsFromText } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import yts from "yt-search";
import { buildAdaptiveLearningPrompt, getLearningProfileForUser } from "@/lib/learning";

export async function GET() {
    try {
        // 1. Fetch latest source material (PDF text) from DB
        const latestSource = await prisma.sourceMaterial.findFirst({
            orderBy: { createdAt: 'desc' },
        });

        let textToProcess = latestSource?.content;
        let personalizationPrompt = "";

        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (session?.user) {
            const profile = await getLearningProfileForUser(prisma, session.user.id);
            personalizationPrompt = buildAdaptiveLearningPrompt(profile);
        }

        // Default fallback if no DB content
        if (!textToProcess || textToProcess.length < 50) {
            textToProcess = "Generate interesting facts about science, technology, and history.";
        }

        // Append adaptive personalization block if user profile exists
        if (personalizationPrompt) {
            textToProcess += personalizationPrompt;
        }

        // Generate MORE lessons
        const lessons = await generateLessonsFromText(textToProcess);

        // Enhance video lessons with real YouTube URLs (same logic as upload)
        for (const lesson of lessons) {
            if (lesson.type === "video" && lesson.videoUrl?.startsWith("SEARCH:")) {
                const query = lesson.videoUrl.replace("SEARCH:", "").trim();
                try {
                    const searchResults = await yts(query);
                    // Find a video < 4 minutes
                    const video = searchResults.videos.find((v) => v.seconds < 240);
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
