import Link from "next/link";
import { headers } from "next/headers";
import { auth, prisma } from "@/lib/auth";
import { PlannerView } from "@/components/planner-view";

export default async function PlannerPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white gap-4">
        <h1 className="text-2xl font-bold">Please log in to access your study planner</h1>
        <Link href="/auth" className="px-6 py-2 bg-blue-600 rounded-full font-bold hover:bg-blue-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  const plan = await prisma.studyPlan.findFirst({
    where: { userId: session.user.id, status: "active" },
    orderBy: { createdAt: "desc" },
  });

  const tasks = plan
    ? await prisma.studyTask.findMany({
        where: { planId: plan.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(now.getDate() - 7);
  const windowEnd = new Date(now);
  windowEnd.setDate(now.getDate() + 14);

  const sessions = plan
    ? await prisma.studySession.findMany({
        where: {
          planId: plan.id,
          startAt: { gte: windowStart, lte: windowEnd },
        },
        orderBy: { startAt: "asc" },
      })
    : [];

  const serializedPlan = plan
    ? {
        id: plan.id,
        title: plan.title,
        timezone: plan.timezone,
        weeklyTargetMinutes: plan.weeklyTargetMinutes,
        focusDays: plan.focusDays,
        startDate: plan.startDate.toISOString(),
        endDate: plan.endDate ? plan.endDate.toISOString() : null,
        status: plan.status,
      }
    : null;

  const serializedTasks = tasks.map((task) => ({
    id: task.id,
    planId: task.planId,
    title: task.title,
    topic: task.topic,
    notes: task.notes,
    estimatedMinutes: task.estimatedMinutes,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    priority: task.priority,
    status: task.status,
    createdAt: task.createdAt.toISOString(),
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
  }));

  const serializedSessions = sessions.map((sessionItem) => ({
    id: sessionItem.id,
    planId: sessionItem.planId,
    taskId: sessionItem.taskId,
    title: sessionItem.title,
    topic: sessionItem.topic,
    startAt: sessionItem.startAt.toISOString(),
    endAt: sessionItem.endAt.toISOString(),
    durationMinutes: sessionItem.durationMinutes,
    status: sessionItem.status,
    energy: sessionItem.energy,
    notes: sessionItem.notes,
    completedAt: sessionItem.completedAt ? sessionItem.completedAt.toISOString() : null,
  }));

  return (
    <PlannerView
      user={{ name: user?.name, image: user?.image }}
      initialPlan={serializedPlan}
      initialTasks={serializedTasks}
      initialSessions={serializedSessions}
    />
  );
}
