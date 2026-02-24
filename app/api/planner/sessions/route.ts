import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth, prisma } from "@/lib/auth";

const createSessionSchema = z.object({
  planId: z.string().min(1).optional(),
  taskId: z.string().min(1).optional(),
  title: z.string().min(2).max(120),
  topic: z.string().max(120).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  energy: z.enum(["low", "medium", "high"]).optional(),
  notes: z.string().max(2000).optional(),
});

const updateSessionSchema = createSessionSchema
  .partial()
  .extend({
    id: z.string().min(1),
    status: z.enum(["scheduled", "completed", "skipped"]).optional(),
  });

async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return null;
  }
  return session;
}

async function resolvePlanId(userId: string, planId?: string | null) {
  if (planId) {
    const plan = await prisma.studyPlan.findFirst({
      where: { id: planId, userId },
    });
    return plan?.id ?? null;
  }

  const plan = await prisma.studyPlan.findFirst({
    where: { userId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  return plan?.id ?? null;
}

export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const planId = await resolvePlanId(session.user.id, searchParams.get("planId"));

  if (!planId) {
    return NextResponse.json({ sessions: [] });
  }

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  if (fromDate && Number.isNaN(fromDate.getTime())) {
    return NextResponse.json({ error: "Invalid from" }, { status: 400 });
  }
  if (toDate && Number.isNaN(toDate.getTime())) {
    return NextResponse.json({ error: "Invalid to" }, { status: 400 });
  }

  const sessions = await prisma.studySession.findMany({
    where: {
      planId,
      ...(fromDate || toDate
        ? {
            startAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = createSessionSchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const data = payload.data;
  const planId = await resolvePlanId(session.user.id, data.planId ?? null);

  if (!planId) {
    return NextResponse.json({ error: "No active plan" }, { status: 400 });
  }

  const startAt = new Date(data.startAt);
  if (Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ error: "Invalid startAt" }, { status: 400 });
  }

  let endAt = data.endAt ? new Date(data.endAt) : null;
  let durationMinutes = data.durationMinutes ?? null;

  if (endAt && Number.isNaN(endAt.getTime())) {
    return NextResponse.json({ error: "Invalid endAt" }, { status: 400 });
  }

  if (!endAt && durationMinutes) {
    endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);
  }

  if (!durationMinutes && endAt) {
    durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / (60 * 1000));
  }

  if (!endAt || !durationMinutes || durationMinutes < 15) {
    return NextResponse.json({ error: "Session duration must be at least 15 minutes" }, { status: 400 });
  }
  if (endAt <= startAt) {
    return NextResponse.json({ error: "endAt must be after startAt" }, { status: 400 });
  }

  if (data.taskId) {
    const task = await prisma.studyTask.findFirst({
      where: { id: data.taskId, plan: { userId: session.user.id } },
    });
    if (!task) {
      return NextResponse.json({ error: "Invalid taskId" }, { status: 400 });
    }
  }

  const sessionItem = await prisma.studySession.create({
    data: {
      planId,
      taskId: data.taskId,
      title: data.title,
      topic: data.topic,
      startAt,
      endAt,
      durationMinutes,
      status: "scheduled",
      energy: data.energy,
      notes: data.notes,
    },
  });

  return NextResponse.json({ session: sessionItem });
}

export async function PUT(req: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = updateSessionSchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const { id, status, startAt, endAt, durationMinutes, ...rest } = payload.data;

  const existingSession = await prisma.studySession.findFirst({
    where: { id, plan: { userId: session.user.id } },
  });

  if (!existingSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const parsedStartAt = startAt ? new Date(startAt) : undefined;
  const parsedEndAt = endAt ? new Date(endAt) : undefined;

  if (parsedStartAt && Number.isNaN(parsedStartAt.getTime())) {
    return NextResponse.json({ error: "Invalid startAt" }, { status: 400 });
  }
  if (parsedEndAt && Number.isNaN(parsedEndAt.getTime())) {
    return NextResponse.json({ error: "Invalid endAt" }, { status: 400 });
  }

  let nextStartAt = parsedStartAt ?? existingSession.startAt;
  let nextEndAt = parsedEndAt ?? existingSession.endAt;
  let nextDuration = durationMinutes ?? existingSession.durationMinutes;

  if (parsedStartAt && !parsedEndAt && durationMinutes) {
    nextEndAt = new Date(parsedStartAt.getTime() + durationMinutes * 60 * 1000);
  }

  if (!durationMinutes && parsedStartAt && parsedEndAt) {
    nextDuration = Math.round((parsedEndAt.getTime() - parsedStartAt.getTime()) / (60 * 1000));
  }

  if (nextEndAt <= nextStartAt) {
    return NextResponse.json({ error: "endAt must be after startAt" }, { status: 400 });
  }

  if (rest.taskId) {
    const task = await prisma.studyTask.findFirst({
      where: { id: rest.taskId, plan: { userId: session.user.id } },
    });
    if (!task) {
      return NextResponse.json({ error: "Invalid taskId" }, { status: 400 });
    }
  }

  const updatedSession = await prisma.studySession.update({
    where: { id: existingSession.id },
    data: {
      taskId: rest.taskId,
      title: rest.title,
      topic: rest.topic,
      startAt: parsedStartAt,
      endAt: parsedEndAt,
      durationMinutes: nextDuration,
      energy: rest.energy,
      notes: rest.notes,
      status,
      completedAt: status === "completed" ? new Date() : status ? null : undefined,
    },
  });

  return NextResponse.json({ session: updatedSession });
}

export async function DELETE(req: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = z.object({ id: z.string().min(1) }).safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const sessionItem = await prisma.studySession.findFirst({
    where: { id: payload.data.id, plan: { userId: session.user.id } },
  });

  if (!sessionItem) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await prisma.studySession.delete({ where: { id: sessionItem.id } });

  return NextResponse.json({ success: true });
}
