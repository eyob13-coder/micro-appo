import { NextRequest, NextResponse } from "next/server";
import { generateAnswer } from "@/lib/ai";

export async function POST(req: NextRequest) {
    try {
        const { question, lessonContent } = await req.json();

        if (!question || !lessonContent) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const answer = await generateAnswer(question, lessonContent);
        return NextResponse.json({ answer });

    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
    }
}
