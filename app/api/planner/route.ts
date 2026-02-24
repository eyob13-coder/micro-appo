import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth, prisma } from "@/lib/auth";

const focusDaySchema = z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

const createPlanSchema = z.object({
  title: z.string().min(2).max(80),
  timezone: z.string().min(1).max(64),
  weeklyTargetMinutes: z.number().int().min(60).max(3000),
  focusDays: z.array(focusDaySchema).min(1).max(7),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
});

const updatePlanSchema = createPlanSchema
  .partial()
  .extend({
    id: z.string().min(1).optional(),
    status: z.enum(["active", "paused", "archived", "completed"]).optional(),
  });

function normalizeFocusDays(days: string[]) {
  const unique = Array.from(new Set(days));
  return unique.sort((a, b) => {
    const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return order.indexOf(a) - order.indexOf(b);
  });
}

async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await prisma.studyPlan.findFirst({
    where: { userId: session.user.id, status: "active" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ plan });
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = createPlanSchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const data = payload.data;
  const startDate = new Date(data.startDate);
  const endDate = data.endDate ? new Date(data.endDate) : null;

  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
  }
  if (endDate && Number.isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid endDate" }, { status: 400 });
  }
  if (endDate && endDate < startDate) {
    return NextResponse.json({ error: "endDate must be after startDate" }, { status: 400 });
  }

  const plan = await prisma.$transaction(async (tx) => {
    await tx.studyPlan.updateMany({
      where: { userId: session.user.id, status: "active" },
      data: { status: "archived" },
    });

    return tx.studyPlan.create({
      data: {
        userId: session.user.id,
        title: data.title,
        timezone: data.timezone,
        weeklyTargetMinutes: data.weeklyTargetMinutes,
        focusDays: normalizeFocusDays(data.focusDays),
        startDate,
        endDate,
        status: "active",
      },
    });
  });

  return NextResponse.json({ plan });
}

export async function PUT(req: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = updatePlanSchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const { id, status, ...rest } = payload.data;
  const plan = await prisma.studyPlan.findFirst({
    where: {
      userId: session.user.id,
      ...(id ? { id } : { status: "active" }),
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  let startDate = rest.startDate ? new Date(rest.startDate) : undefined;
  let endDate: Date | null | undefined = undefined;

  if (rest.endDate === null) {
    endDate = null;
  } else if (rest.endDate) {
    endDate = new Date(rest.endDate);
  }

  if (startDate && Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
  }
  if (endDate instanceof Date && Number.isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid endDate" }, { status: 400 });
  }
  if (startDate && endDate instanceof Date && endDate < startDate) {
    return NextResponse.json({ error: "endDate must be after startDate" }, { status: 400 });
  }

  const updatedPlan = await prisma.$transaction(async (tx) => {
    if (status === "active") {
      await tx.studyPlan.updateMany({
        where: { userId: session.user.id, status: "active" },
        data: { status: "archived" },
      });
    }

    return tx.studyPlan.update({
      where: { id: plan.id },
      data: {
        title: rest.title,
        timezone: rest.timezone,
        weeklyTargetMinutes: rest.weeklyTargetMinutes,
        focusDays: rest.focusDays ? normalizeFocusDays(rest.focusDays) : undefined,
        startDate,
        endDate,
        status,
      },
    });
  });

  return NextResponse.json({ plan: updatedPlan });
}
