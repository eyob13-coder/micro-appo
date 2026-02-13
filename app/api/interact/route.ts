import { NextRequest, NextResponse } from "next/server";
import { prisma, auth } from "@/lib/auth"; // auth exported from lib/auth
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { lessonId, type } = body; // type: 'save' | 'like'

        if (!lessonId || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Upsert interaction
        // If save -> save. If unsave -> delete?
        // Let's assume toggle logic happens on frontend, creating/deleting.
        // But for simplicity, let's treat POST as "Add". Use DELETE for remove?
        // Or POST with `action: 'add' | 'remove'`?
        // Let's stick to simple "add" via POST for now. Maybe toggle logic in frontend just calls different endpoints or methods.
        // Actually, let's make it toggle-able on backend or just use upsert.

        // If it exists, updated `createdAt`? No, unique constraint on [userId, lessonId, type].
        // So upsert is fine.

        const interaction = await prisma.userInteraction.upsert({
            where: {
                userId_lessonId_type: {
                    userId,
                    lessonId,
                    type
                }
            },
            update: {
                createdAt: new Date() // Refreshed timestamp
            },
            create: {
                userId,
                lessonId,
                type
            }
        });

        return NextResponse.json(interaction);
    } catch (error) {
        console.error("Interaction error:", error);
        return NextResponse.json({ error: "Failed to process interaction" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { lessonId, type } = body;

        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.userInteraction.deleteMany({
            where: {
                userId: session.user.id,
                lessonId,
                type
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete interaction" }, { status: 500 });
    }
}
