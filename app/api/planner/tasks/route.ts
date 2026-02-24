import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth, prisma } from "@/lib/auth";

const createTaskSchema = z.object({
  planId: z.string().min(1).optional(),
  title: z.string().min(2).max(120),
  topic: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  estimatedMinutes: z.number().int().min(10).max(600).optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.number().int().min(1).max(3).optional(),
});

const updateTaskSchema = createTaskSchema
  .partial()
  .extend({
    id: z.string().min(1),
    status: z.enum(["backlog", "scheduled", "in_progress", "completed", "skipped"]).optional(),
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
    return NextResponse.json({ tasks: [] });
  }

  const status = searchParams.get("status");

  const tasks = await prisma.studyTask.findMany({
    where: {
      planId,
      ...(status ? { status } : {}),
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = createTaskSchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const data = payload.data;
  const planId = await resolvePlanId(session.user.id, data.planId ?? null);

  if (!planId) {
    return NextResponse.json({ error: "No active plan" }, { status: 400 });
  }

  const dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (dueDate && Number.isNaN(dueDate.getTime())) {
    return NextResponse.json({ error: "Invalid dueDate" }, { status: 400 });
  }

  const task = await prisma.studyTask.create({
    data: {
      planId,
      title: data.title,
      topic: data.topic,
      notes: data.notes,
      estimatedMinutes: data.estimatedMinutes,
      dueDate,
      priority: data.priority ?? 2,
      status: "backlog",
    },
  });

  return NextResponse.json({ task });
}

export async function PUT(req: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = updateTaskSchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const { id, dueDate, status, ...rest } = payload.data;

  const task = await prisma.studyTask.findFirst({
    where: { id, plan: { userId: session.user.id } },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const parsedDueDate = dueDate ? new Date(dueDate) : undefined;
  if (parsedDueDate && Number.isNaN(parsedDueDate.getTime())) {
    return NextResponse.json({ error: "Invalid dueDate" }, { status: 400 });
  }

  const updatedTask = await prisma.studyTask.update({
    where: { id: task.id },
    data: {
      title: rest.title,
      topic: rest.topic,
      notes: rest.notes,
      estimatedMinutes: rest.estimatedMinutes,
      dueDate: parsedDueDate,
      priority: rest.priority,
      status,
      completedAt: status === "completed" ? new Date() : status ? null : undefined,
    },
  });

  return NextResponse.json({ task: updatedTask });
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

  const task = await prisma.studyTask.findFirst({
    where: { id: payload.data.id, plan: { userId: session.user.id } },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await prisma.studyTask.delete({ where: { id: task.id } });

  return NextResponse.json({ success: true });
}
