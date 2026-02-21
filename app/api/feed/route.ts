import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth, prisma } from "@/lib/auth";
import { splitPdfTextIntoChunks } from "@/lib/pdf-sequence";
import { DEFAULT_LESSONS } from "@/lib/default-lessons";

// Default fallback lessons if no PDF has been uploaded yet
const defaultLessons = DEFAULT_LESSONS;

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(defaultLessons);
        }

        const { searchParams } = new URL(request.url);
        const requestedSourceId = searchParams.get("sourceId");

        const source = requestedSourceId
            ? await prisma.sourceMaterial.findFirst({
                where: { id: requestedSourceId, userId: session.user.id },
            })
            : await prisma.sourceMaterial.findFirst({
                where: { userId: session.user.id },
                orderBy: { createdAt: "desc" },
            });

        if (!source) {
            return NextResponse.json(defaultLessons);
        }

        const lessons = await prisma.lesson.findMany({
            where: { sourceMaterialId: source.id },
            orderBy: { sequence: "asc" },
            take: 20,
        });

        if (lessons.length > 0) {
            const chunks = splitPdfTextIntoChunks(source.content);
            const maxChunk = lessons.reduce((max, lesson) => Math.max(max, lesson.chunkIndex ?? 0), -1);
            const nextChunkIndex = maxChunk + 1;
            return NextResponse.json({
                lessons,
                sourceId: source.id,
                nextChunkIndex,
                hasMore: nextChunkIndex < chunks.length,
            });
        }
    } catch (error) {
        console.error("Failed to fetch lessons:", error);
    }

    return NextResponse.json(defaultLessons);
}
