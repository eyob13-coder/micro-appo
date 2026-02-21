import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth, prisma } from "@/lib/auth";
import { generateLessonsFromText } from "@/lib/ai";
import yts from "yt-search";
import { splitPdfTextIntoChunks } from "@/lib/pdf-sequence";

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sourceId = searchParams.get("sourceId");
        const chunkIndex = Number(searchParams.get("chunkIndex") ?? "0");

        if (!sourceId) {
            return NextResponse.json({ error: "Missing sourceId" }, { status: 400 });
        }

        if (Number.isNaN(chunkIndex) || chunkIndex < 0) {
            return NextResponse.json({ error: "Invalid chunkIndex" }, { status: 400 });
        }

        const source = await prisma.sourceMaterial.findFirst({
            where: { id: sourceId, userId: session.user.id },
        });

        if (!source) {
            return NextResponse.json({ error: "Source not found" }, { status: 404 });
        }

        const existingChunkLessons = await prisma.lesson.findMany({
            where: { sourceMaterialId: source.id, chunkIndex },
            orderBy: { sequence: "asc" },
        });

        if (existingChunkLessons.length > 0) {
            const chunksForExisting = splitPdfTextIntoChunks(source.content);
            return NextResponse.json({
                lessons: existingChunkLessons,
                sourceId,
                nextChunkIndex: chunkIndex + 1,
                hasMore: chunkIndex + 1 < chunksForExisting.length,
            });
        }

        const chunks = splitPdfTextIntoChunks(source.content);
        if (chunkIndex >= chunks.length) {
            return NextResponse.json({
                lessons: [],
                sourceId,
                nextChunkIndex: chunkIndex,
                hasMore: false,
            });
        }

        const textToProcess = chunks[chunkIndex] ?? "";
        if (!textToProcess || textToProcess.length < 20) {
            return NextResponse.json({
                lessons: [],
                sourceId,
                nextChunkIndex: chunkIndex + 1,
                hasMore: chunkIndex + 1 < chunks.length,
            });
        }

        // Generate next lessons from the next sequential chunk of the same uploaded PDF.
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
        const latestForSource = await prisma.lesson.findFirst({
            where: { sourceMaterialId: source.id },
            orderBy: { sequence: "desc" },
            select: { sequence: true },
        });
        const baseSequence = latestForSource?.sequence ?? 0;

        const savedLessons = await Promise.all(lessons.map(async (lesson, idx) => {
            return await prisma.lesson.create({
                data: {
                    sourceMaterialId: source.id,
                    type: lesson.type,
                    content: lesson.content,
                    videoUrl: lesson.videoUrl,
                    options: lesson.options || [],
                    correctAnswer: lesson.correctAnswer,
                    explanation: lesson.explanation,
                    chunkIndex,
                    sequence: baseSequence + idx + 1,
                }
            });
        }));

        return NextResponse.json({
            lessons: savedLessons,
            sourceId,
            nextChunkIndex: chunkIndex + 1,
            hasMore: chunkIndex + 1 < chunks.length,
        });
    } catch (error) {
        console.error("Failed to generate more lessons:", error);
        return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
    }
}
