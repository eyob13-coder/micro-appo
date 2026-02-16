import type { PrismaClient } from "@/lib/generated/prisma";

export type LessonType = "summary" | "mcq" | "video";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface LearningProfile {
  preferredTopics: string[];
  weakTopics: string[];
  dueReviewTopics: string[];
  mcqAccuracy: number | null;
  completionRate: number | null;
  engagementByType: Record<LessonType, number>;
  targetMix: Record<LessonType, number>;
  difficultyLevel: DifficultyLevel;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "is", "are",
  "was", "were", "be", "being", "been", "that", "this", "it", "as", "at", "by", "from",
  "about", "into", "over", "after", "before", "under", "between", "your", "you", "we",
  "they", "their", "our", "his", "her", "its", "can", "will", "just", "than", "then",
  "what", "which", "when", "where", "how", "why", "all", "any", "but", "not"
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

function topKeywords(texts: string[], limit = 8): string[] {
  const freq = new Map<string, number>();
  for (const text of texts) {
    for (const word of tokenize(text)) {
      freq.set(word, (freq.get(word) ?? 0) + 1);
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export function toPercent(value: number): number {
  return Math.round(value * 100);
}

export async function getLearningProfileForUser(prisma: PrismaClient, userId: string): Promise<LearningProfile> {
  const interactions = await prisma.userInteraction.findMany({
    where: { userId },
    include: { lesson: true },
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  const engagementByType: Record<LessonType, number> = { summary: 0, mcq: 0, video: 0 };
  const preferredTexts: string[] = [];
  const weakTexts: string[] = [];

  let views = 0;
  let completions = 0;
  let skips = 0;
  let mcqCorrect = 0;
  let mcqWrong = 0;

  for (const interaction of interactions) {
    const lesson = interaction.lesson;
    const lessonType = lesson?.type as LessonType | undefined;

    if (interaction.type === "view") views += 1;
    if (interaction.type === "complete") completions += 1;
    if (interaction.type === "skip") skips += 1;
    if (interaction.type === "mcq_correct") mcqCorrect += 1;
    if (interaction.type === "mcq_wrong") mcqWrong += 1;

    if (!lesson || !lessonType || !["summary", "mcq", "video"].includes(lessonType)) {
      continue;
    }

    if (interaction.type === "like") {
      engagementByType[lessonType] += 1;
      preferredTexts.push(lesson.content);
    } else if (interaction.type === "save") {
      engagementByType[lessonType] += 2;
      preferredTexts.push(lesson.content, lesson.content);
    } else if (interaction.type === "complete") {
      engagementByType[lessonType] += 1;
      preferredTexts.push(lesson.content);
    } else if (interaction.type === "mcq_correct") {
      engagementByType[lessonType] += 1;
    } else if (interaction.type === "skip" || interaction.type === "mcq_wrong") {
      weakTexts.push(lesson.content);
    }
  }

  const attempts = mcqCorrect + mcqWrong;
  const mcqAccuracy = attempts > 0 ? mcqCorrect / attempts : null;
  const completionRate = views > 0 ? completions / views : null;

  const preferredTopics = topKeywords(preferredTexts, 8);
  const weakTopics = topKeywords(weakTexts, 8);
  const dueReviewTopics = weakTopics.filter((topic) => !preferredTopics.includes(topic)).slice(0, 5);

  let targetMix: Record<LessonType, number> = { summary: 0.4, mcq: 0.4, video: 0.2 };
  let difficultyLevel: DifficultyLevel = "intermediate";

  if (mcqAccuracy !== null) {
    if (mcqAccuracy < 0.5) {
      targetMix = { summary: 0.5, mcq: 0.25, video: 0.25 };
      difficultyLevel = "beginner";
    } else if (mcqAccuracy < 0.8) {
      targetMix = { summary: 0.4, mcq: 0.4, video: 0.2 };
      difficultyLevel = "intermediate";
    } else {
      targetMix = { summary: 0.25, mcq: 0.55, video: 0.2 };
      difficultyLevel = "advanced";
    }
  }

  // Re-engagement mode: if user skips heavily, lower challenge and increase visual content.
  if (skips >= 3 && skips > completions) {
    targetMix.video = Math.min(targetMix.video + 0.1, 0.35);
    targetMix.summary = Math.max(targetMix.summary - 0.05, 0.2);
    targetMix.mcq = Math.max(targetMix.mcq - 0.05, 0.2);
    if (difficultyLevel === "advanced") {
      difficultyLevel = "intermediate";
    }
  }

  if (completionRate !== null && completionRate < 0.4) {
    difficultyLevel = "beginner";
  }

  return {
    preferredTopics,
    weakTopics,
    dueReviewTopics,
    mcqAccuracy,
    completionRate,
    engagementByType,
    targetMix,
    difficultyLevel,
  };
}

export function buildAdaptiveLearningPrompt(profile: LearningProfile): string {
  const topicLine = profile.preferredTopics.length > 0
    ? profile.preferredTopics.join(", ")
    : "science, technology, learning skills";
  const weakLine = profile.weakTopics.length > 0
    ? profile.weakTopics.join(", ")
    : "none detected";
  const reviewLine = profile.dueReviewTopics.length > 0
    ? profile.dueReviewTopics.join(", ")
    : weakLine;
  const accuracyLine = profile.mcqAccuracy === null ? "unknown" : `${toPercent(profile.mcqAccuracy)}%`;
  const completionLine = profile.completionRate === null ? "unknown" : `${toPercent(profile.completionRate)}%`;

  return [
    "",
    "[ADAPTIVE LEARNING PROFILE]",
    `Preferred topics from interaction history: ${topicLine}.`,
    `Weak topics (based on skips/wrong answers): ${weakLine}.`,
    `MCQ accuracy: ${accuracyLine}.`,
    `Lesson completion rate: ${completionLine}.`,
    `Target lesson mix for this batch: summary ${toPercent(profile.targetMix.summary)}%, mcq ${toPercent(profile.targetMix.mcq)}%, video ${toPercent(profile.targetMix.video)}%.`,
    `Difficulty level for this user: ${profile.difficultyLevel}.`,
    "",
    "[SPACED REPETITION PLAN]",
    `Start this batch with 1-2 short review items focused on: ${reviewLine}.`,
    "Then continue with new content and interleave review every 3-4 lessons.",
    "If the learner gets answers wrong, repeat the concept in a simpler form before the next quiz.",
    "",
    "[DIFFICULTY ADAPTATION]",
    "Beginner: short sentences, concrete examples, basic MCQs.",
    "Intermediate: mixed conceptual and application MCQs.",
    "Advanced: challenge-style MCQs with distractors and transfer questions.",
    "Use the learner's current difficulty level above.",
  ].join("\n");
}

