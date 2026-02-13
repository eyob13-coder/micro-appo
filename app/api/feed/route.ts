import { NextResponse } from "next/server";

// Default fallback lessons if no PDF has been uploaded yet
const defaultLessons = [
    {
        id: "1",
        type: "summary" as const,
        content:
            "Dopamine isn't just about pleasure; it's about anticipation. When you learn in bite-sized chunks, your brain releases dopamine, making you want to continue.",
    },
    {
        id: "2",
        type: "summary" as const,
        content:
            "The Ebbinghaus Forgetting Curve shows we lose 70% of new info within 24 hours. Spaced repetition breaks this curve.",
    },
    {
        id: "3",
        type: "mcq" as const,
        content:
            "According to the Forgetting Curve, how much information do we typically lose within 24 hours?",
        options: ["10%", "30%", "50%", "70%"],
        correctAnswer: 3,
        explanation:
            "Ebbinghaus discovered that memory decay is exponential. Without review, we lose about 70% of new material within the first day.",
    },
    {
        id: "4",
        type: "summary" as const,
        content:
            "Active recall forces your brain to retrieve information from memory, strengthening neural pathways for long-term storage.",
    },
];

import { prisma } from "@/lib/auth";

export async function GET() {
    try {
        const lessons = await prisma.lesson.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        if (lessons.length > 0) {
            return NextResponse.json(lessons);
        }
    } catch (error) {
        console.error("Failed to fetch lessons:", error);
    }

    return NextResponse.json(defaultLessons);
}
