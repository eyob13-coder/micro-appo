import Link from "next/link";
import { headers } from "next/headers";
import { auth, prisma } from "@/lib/auth";
import { getLearningProfileForUser, toPercent } from "@/lib/learning";
import { DashboardView } from "@/components/dashboard-view";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white gap-4">
        <h1 className="text-2xl font-bold">Please log in to view your dashboard</h1>
        <Link href="/auth" className="px-6 py-2 bg-blue-600 rounded-full font-bold hover:bg-blue-500 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  const isPro = user?.isPro || false;
  const uploadCount = user?.uploadCount || 0;
  const limit = 3;

  const savedInteractions = await prisma.userInteraction.findMany({
    where: {
      userId: session.user.id,
      type: "save",
    },
    include: {
      lesson: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalLessons = await prisma.lesson.count();
  const learningProfile = await getLearningProfileForUser(prisma, session.user.id);
  const accuracyText = learningProfile.mcqAccuracy === null ? "N/A" : `${toPercent(learningProfile.mcqAccuracy)}%`;
  const completionText = learningProfile.completionRate === null ? "N/A" : `${toPercent(learningProfile.completionRate)}%`;
  const reviewTopicsText =
    learningProfile.dueReviewTopics.length > 0 ? learningProfile.dueReviewTopics.slice(0, 3).join(", ") : "No urgent review topics";

  return (
    <DashboardView
      user={{ name: session.user.name, image: session.user.image }}
      isPro={isPro}
      uploadCount={uploadCount}
      limit={limit}
      totalLessons={totalLessons}
      accuracyText={accuracyText}
      completionText={completionText}
      reviewTopicsText={reviewTopicsText}
      difficultyLevel={learningProfile.difficultyLevel}
      savedInteractions={savedInteractions.map((interaction) => ({
        id: interaction.id,
        createdAt: interaction.createdAt.toISOString(),
        lesson: {
          type: interaction.lesson.type as "summary" | "mcq" | "video",
          content: interaction.lesson.content,
        },
      }))}
    />
  );
}
