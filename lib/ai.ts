import OpenAI from "openai";

export interface MicroLesson {
  id: string;
  type: "summary" | "mcq" | "video";
  content: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  videoUrl?: string;
}

export class AIServiceError extends Error {
  status: number;
  code?: string;
  retryAfterSeconds?: number;

  constructor(message: string, status: number, code?: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "AIServiceError";
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const SYSTEM_PROMPT = `
You are an expert educator and curriculum designer.

You are not summarizing.
You are teaching.

You will receive raw PDF text.
Your task is to transform it into structured micro-lessons that help a learner actually understand and retain the material.

Core Principle:
Each lesson must deliver insight, not just reword the text.
If a lesson sounds like a simple sentence rewrite, improve it.

LESSON TYPES (choose one per lesson):

1. "summary"
   - 1–2 sentences (15–40 words)
   - Must explain a key idea clearly
   - May clarify meaning or add brief interpretation
   - Should make the idea easier to understand than the original text

2. "mcq"
   - Clear question ending with "?"
   - Exactly 4 options
   - One correctAnswer (0-based index)
   - Distractors must be believable and based on nearby ideas
   - explanation must explain WHY the answer is correct in 1–2 sentences

3. "video"
   - Reinforcement suggestion for complex or visual concepts
   - content must hook the learner by naming the exact concept
   - videoUrl must start with "SEARCH: " followed by a specific YouTube query ending with "under 2 minutes"

STRICT RULES:

- Generate 6–10 lessons.
- Minimum 2 MCQs.
- Follow the conceptual order of the text from beginning to end.
- Do NOT skip ahead.
- Do NOT invent facts not present in the text.
- Do NOT use vague filler phrases.
- Every lesson must reference real concepts from the provided text.
- If the text explains a process, break it into steps across lessons.
- If the text defines something, explain why it matters.
- If the text compares ideas, highlight the difference clearly.

QUALITY FILTER (VERY IMPORTANT):

Before finalizing each lesson, silently ask:
"Does this help someone understand better than the original sentence?"
If not, improve it.

OUTPUT RULES:

Return ONLY valid JSON.
No markdown.
No commentary.
No trailing commas.

Use this structure:

[
  {
    "id": "1",
    "type": "summary",
    "content": "Clear teaching explanation..."
  },
  {
    "id": "2",
    "type": "mcq",
    "content": "Question?",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correctAnswer": 2,
    "explanation": "Why this is correct..."
  }
]
`;

const readEnv = (name: string): string | undefined => {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const AI_PROVIDER_NAME = "Gemini";
const geminiApiKey = readEnv("GEMINI_API_KEY") ?? readEnv("GOOGLE_API_KEY") ?? readEnv("OPENAI_API_KEY");
const geminiBaseUrl = readEnv("GEMINI_BASE_URL") ?? "https://generativelanguage.googleapis.com/v1beta/openai";
const GEMINI_MODEL = readEnv("GEMINI_MODEL") ?? "gemini-2.0-flash";
const GEMINI_TIMEOUT_MS = Number(readEnv("GEMINI_TIMEOUT_MS") ?? 25000);

const openai = new OpenAI({
  apiKey: geminiApiKey,
  baseURL: geminiBaseUrl,
});

const getErrorDetails = (error: unknown): { status: number; code?: string; message: string } => {
  const maybeError = error as { status?: number; code?: string; message?: string };
  const status = typeof maybeError.status === "number" ? maybeError.status : 0;
  const code = typeof maybeError.code === "string" ? maybeError.code : undefined;
  const message = typeof maybeError.message === "string" ? maybeError.message : "Unknown AI provider error";
  return { status, code, message };
}

const getRetryAfterSeconds = (error: unknown): number | undefined => {
  const maybeError = error as {
    headers?: Record<string, string | string[]>;
    response?: { headers?: Record<string, string | string[]> | { get?: (key: string) => string | null } };
  };
  const headers =
    maybeError?.response?.headers ??
    maybeError?.headers;
  if (!headers) return undefined;
  const readHeader = (key: string): string | undefined => {
    if (typeof (headers as { get?: (k: string) => string | null }).get === "function") {
      const value = (headers as { get: (k: string) => string | null }).get(key);
      return value ?? undefined;
    }
    const record = headers as Record<string, string | string[]>;
    const value = record[key] ?? record[key.toLowerCase()];
    if (Array.isArray(value)) return value[0];
    return value;
  };
  const retryAfter = readHeader("retry-after");
  if (!retryAfter) return undefined;
  const asNumber = Number(retryAfter);
  if (!Number.isNaN(asNumber) && asNumber > 0) return Math.ceil(asNumber);
  const asDate = Date.parse(retryAfter);
  if (!Number.isNaN(asDate)) {
    const diffMs = asDate - Date.now();
    return diffMs > 0 ? Math.ceil(diffMs / 1000) : undefined;
  }
  return undefined;
}

const stripTrailingCommas = (jsonStr: string): string => {
  return jsonStr.replace(/,\s*([\]}])/g, "$1");
};

const letterToIndex = (letter: unknown): number | undefined => {
  if (typeof letter === "number") return letter;
  if (typeof letter === "string") {
    const upper = letter.trim().toUpperCase();
    if (upper.length === 1 && upper >= "A" && upper <= "Z") {
      return upper.charCodeAt(0) - "A".charCodeAt(0);
    }
    const parsed = parseInt(letter, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return undefined;
}

const normalizeOptions = (rawOptions: unknown): string[] | undefined => {
  if (!rawOptions) return undefined;

  if (Array.isArray(rawOptions)) {
    const options = rawOptions.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
    return options.length > 0 ? options : undefined;
  }

  if (typeof rawOptions === "object") {
    const optionObject = rawOptions as Record<string, unknown>;
    const orderedKeys = ["A", "B", "C", "D"];
    const fromLetters = orderedKeys
      .map((key) => optionObject[key])
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

    if (fromLetters.length > 0) return fromLetters;

    const fallbackValues = Object.values(optionObject).filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    );
    return fallbackValues.length > 0 ? fallbackValues : undefined;
  }

  return undefined;
}

const normalizeCorrectAnswer = (rawAnswer: unknown, options?: string[]): number | undefined => {
  const parsed = letterToIndex(rawAnswer);
  if (parsed === undefined) return undefined;
  if (parsed < 0) return undefined;
  if (options && parsed >= options.length) return undefined;
  return parsed;
}

const normalizeLessonType = (rawType: unknown, lessonRecord: Record<string, unknown>): "summary" | "mcq" | "video" => {
  if (rawType === "summary" || rawType === "mcq" || rawType === "video") return rawType;
  if (typeof lessonRecord.videoUrl === "string" && lessonRecord.videoUrl.length > 0) return "video";

  const contentObj = typeof lessonRecord.content === "object" && lessonRecord.content ? (lessonRecord.content as Record<string, unknown>) : null;
  if (normalizeOptions(lessonRecord.options)?.length || normalizeOptions(contentObj?.options)?.length) return "mcq";
  return "summary";
}

const normalizeContent = (rawContent: unknown, lessonRecord: Record<string, unknown>, type: "summary" | "mcq" | "video"): string => {
  if (typeof rawContent === "string" && rawContent.trim().length > 0) return rawContent.trim();

  if (rawContent && typeof rawContent === "object") {
    const contentObj = rawContent as Record<string, unknown>;
    const question = contentObj.question;
    const content = contentObj.content;
    const title = contentObj.title;

    if (type === "mcq" && typeof question === "string" && question.trim().length > 0) return question.trim();
    if (typeof content === "string" && content.trim().length > 0) return content.trim();
    if (typeof title === "string" && title.trim().length > 0) return title.trim();
  }

  if (type === "video") return "Quick concept video";
  if (type === "mcq") return "Quick knowledge check";
  if (typeof lessonRecord.content === "string") return lessonRecord.content;
  return "Key takeaway";
}

const fallbackOptionsFromSentence = (sentence: string): string[] => {
  const short = sentence.length > 80 ? `${sentence.slice(0, 77)}...` : sentence;
  return [
    short,
    "It explains a core concept from the uploaded material.",
    "It introduces an unrelated topic.",
    "It summarizes nothing from the source.",
  ];
}

const wordCount = (text: string): number => {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

const LOW_VALUE_PHRASES = [
  "quick concept video",
  "quick knowledge check",
  "key takeaway",
  "watch this quick intro",
  "based on the uploaded pdf section",
];

const isLowValueContent = (text: string): boolean => {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return true;
  if (wordCount(normalized) < 6) return true;
  return LOW_VALUE_PHRASES.some((phrase) => normalized.includes(phrase));
}

const buildLocalFallbackLessons = (text: string): MicroLesson[] => {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30)
    .slice(0, 4);

  const s1 = sentences[0] ?? "Micro-learning works best when content is concise, sequenced, and easy to recall.";
  const s2 = sentences[1] ?? "Spaced repetition improves retention by revisiting information over increasing intervals.";
  const s3 = sentences[2] ?? "Active recall helps move knowledge from short-term memory into long-term memory.";
  const s4 = sentences[3] ?? "Short sessions and frequent checkpoints improve focus and completion rates.";

  return [
    {
      id: "fallback-1",
      type: "video",
      content: "Quick concept video for this topic",
      videoUrl: `SEARCH: ${s1.split(" ").slice(0, 8).join(" ")} animation under 2 minutes`,
    },
    {
      id: "fallback-2",
      type: "summary",
      content: s1,
    },
    {
      id: "fallback-3",
      type: "mcq",
      content: `Which statement best matches the uploaded material?`,
      options: fallbackOptionsFromSentence(s2),
      correctAnswer: 1,
      explanation: "The second option is the best generic match to the uploaded source context.",
    },
    {
      id: "fallback-4",
      type: "summary",
      content: s3,
    },
    {
      id: "fallback-5",
      type: "mcq",
      content: "What learning method helps strengthen long-term retention?",
      options: [
        "Avoid review and rely on one-time reading.",
        "Use spaced repetition and active recall.",
        "Only watch long videos without checkpoints.",
        "Skip quizzes to reduce cognitive load.",
      ],
      correctAnswer: 1,
      explanation: "Spaced repetition plus active recall is the most reliable strategy for retention.",
    },
    {
      id: "fallback-6",
      type: "summary",
      content: s4,
    },
  ];
}

const sentenceToTopic = (sentence: string): string => {
  return sentence
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 7)
    .join(" ")
    .trim() || "core concept";
}

const buildRichFallbackLessonsFromPdf = (text: string): MicroLesson[] => {
  const statements = extractPdfStatements(text);
  const s1 = statements[0] ?? "This uploaded PDF introduces an important core concept.";
  const s2 = statements[1] ?? "The PDF provides supporting details that explain how the concept works.";
  const s3 = statements[2] ?? "The PDF connects the concept to a practical implication or outcome.";
  const s4 = statements[3] ?? "The PDF highlights a key distinction that prevents common mistakes.";
  const topic = sentenceToTopic(s1);

  return [
    {
      id: "pdf-rich-1",
      type: "video",
      content: `Watch a short explainer to reinforce: ${s1}`,
      videoUrl: `SEARCH: ${topic} explained under 2 minutes`,
    },
    { id: "pdf-rich-2", type: "summary", content: s1 },
    {
      id: "pdf-rich-3",
      type: "mcq",
      content: "Which statement is explicitly supported by the uploaded PDF section?",
      options: [
        s2,
        `The PDF says this concept is irrelevant and can be ignored.`,
        `The PDF states this idea only applies outside the discussed topic.`,
        `The PDF claims the opposite conclusion without evidence.`,
      ],
      correctAnswer: 0,
      explanation: "The first option is taken directly from the uploaded PDF context.",
    },
    { id: "pdf-rich-4", type: "summary", content: s3 },
    {
      id: "pdf-rich-5",
      type: "mcq",
      content: "According to the uploaded PDF, which takeaway best matches the material?",
      options: [
        s4,
        `The PDF says there are no meaningful distinctions in this section.`,
        `The PDF removes this concept from the main argument.`,
        `The PDF concludes this concept is a historical footnote only.`,
      ],
      correctAnswer: 0,
      explanation: "The first option matches a key statement from the uploaded PDF.",
    },
    {
      id: "pdf-rich-6",
      type: "summary",
      content: `Together, these points show how the PDF builds from concept to application: ${s2}`,
    },
  ];
}

const extractPdfStatements = (sourceText: string): string[] => {
  const statements = sourceText
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 25)
    .map((line) => (line.length > 120 ? `${line.slice(0, 117)}...` : line));

  if (statements.length >= 4) return statements;

  const fallback = sourceText
    .replace(/\s+/g, " ")
    .split(/[,:;]\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 20)
    .map((line) => (line.length > 120 ? `${line.slice(0, 117)}...` : line));

  const merged = [...statements, ...fallback];
  if (merged.length >= 4) return merged;

  return [
    ...merged,
    "The uploaded PDF introduces key concepts from this section.",
    "The uploaded PDF explains details that support the main topic.",
    "The uploaded PDF includes examples relevant to this concept.",
    "The uploaded PDF connects this idea to practical understanding.",
  ].slice(0, 4);
}

const buildPdfGroundedMcq = (sourceText: string, ordinal: number, id: string): MicroLesson => {
  const statements = extractPdfStatements(sourceText);
  const total = statements.length;
  const start = total > 0 ? ordinal % total : 0;
  const picked: string[] = [];

  for (let offset = 0; offset < total && picked.length < 4; offset += 1) {
    const candidate = statements[(start + offset) % total];
    if (candidate && !picked.includes(candidate)) {
      picked.push(candidate);
    }
  }

  while (picked.length < 4) {
    picked.push(`Uploaded PDF statement ${picked.length + 1} from this section.`);
  }

  const correctStatement = picked[0];
  const topicSeed = correctStatement
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 4)
    .join(" ")
    .trim() || "this concept";

  const questionTemplates = [
    `What does the text indicate about ${topicSeed}?`,
    `Which statement best explains ${topicSeed} according to the lesson?`,
    `In this lesson, what is the most accurate takeaway about ${topicSeed}?`,
    `Which option is directly supported by the material about ${topicSeed}?`,
  ];
  const question = questionTemplates[ordinal % questionTemplates.length];

  return {
    id,
    type: "mcq",
    content: question,
    options: picked,
    correctAnswer: 0,
    explanation: `The correct option is directly stated in the material: "${correctStatement}"`,
  };
}

const ensurePdfGroundedMcqs = (lessons: MicroLesson[], sourceText: string): MicroLesson[] => {
  const normalized = lessons.map((lesson, idx) => ({
    ...lesson,
    id: lesson.id || String(idx + 1),
  }));

  let mcqOrdinal = 0;
  const withGroundedMcq = normalized.map((lesson) => {
    if (lesson.type !== "mcq") return lesson;
    const hasValidOptions = Array.isArray(lesson.options) && lesson.options.length === 4;
    const hasValidAnswer =
      typeof lesson.correctAnswer === "number" && lesson.correctAnswer >= 0 && lesson.correctAnswer < 4;
    const questionText = lesson.content.toLowerCase();
    const isRoboticQuestion =
      questionText.includes("based on the uploaded pdf section") ||
      questionText.includes("appears earliest in the text");
    const hasUsableQuestion = lesson.content.includes("?") && wordCount(lesson.content) >= 7 && !isRoboticQuestion;

    if (hasValidOptions && hasValidAnswer && hasUsableQuestion) {
      return lesson;
    }

    const grounded = buildPdfGroundedMcq(sourceText, mcqOrdinal, lesson.id);
    mcqOrdinal += 1;
    return grounded;
  });

  const minimumMcqCount = 2;
  const currentMcqCount = withGroundedMcq.filter((lesson) => lesson.type === "mcq").length;
  if (currentMcqCount >= minimumMcqCount) return withGroundedMcq;

  const needed = minimumMcqCount - currentMcqCount;
  const injected = [...withGroundedMcq];
  for (let i = 0; i < needed; i += 1) {
    const mcq = buildPdfGroundedMcq(sourceText, mcqOrdinal, `pdf-mcq-${injected.length + 1}`);
    mcqOrdinal += 1;
    const insertAt = Math.min(1 + i, injected.length);
    injected.splice(insertAt, 0, mcq);
  }

  return injected;
}

const enforceLessonSubstance = (lessons: MicroLesson[], sourceText: string): MicroLesson[] => {
  const statements = extractPdfStatements(sourceText);
  let summaryCursor = 0;
  let videoCursor = 0;

  return lessons.map((lesson, i) => {
    if (lesson.type === "summary") {
      const content =
        !isLowValueContent(lesson.content) && wordCount(lesson.content) >= 10
          ? lesson.content
          : statements[summaryCursor++ % statements.length];

      return { ...lesson, id: lesson.id || String(i + 1), content };
    }

    if (lesson.type === "video") {
      const anchor = statements[videoCursor++ % statements.length];
      const content = isLowValueContent(lesson.content)
        ? `Watch a short explainer to reinforce: ${anchor}`
        : lesson.content;
      const videoUrl = lesson.videoUrl?.trim()
        ? lesson.videoUrl
        : `SEARCH: ${sentenceToTopic(anchor)} explained under 2 minutes`;
      return { ...lesson, id: lesson.id || String(i + 1), content, videoUrl };
    }

    if (lesson.type === "mcq") {
      const hasValidQuestion = lesson.content.includes("?") && wordCount(lesson.content) >= 8;
      const hasValidExplanation = typeof lesson.explanation === "string" && wordCount(lesson.explanation) >= 8;
      if (hasValidQuestion && hasValidExplanation) {
        return { ...lesson, id: lesson.id || String(i + 1) };
      }
      return buildPdfGroundedMcq(sourceText, i, lesson.id || String(i + 1));
    }

    return { ...lesson, id: lesson.id || String(i + 1) };
  });
}

const parseLessons = (rawText: string): MicroLesson[] => {
  let cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Fix trailing commas that LLMs frequently produce
  cleaned = stripTrailingCommas(cleaned);

  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (!Array.isArray(parsed)) {
      throw new AIServiceError("AI returned unexpected lesson format. Please try again.", 502);
    }

    return parsed.map((lesson, i) => {
      const lessonRecord = (lesson && typeof lesson === "object" ? lesson : {}) as Record<string, unknown>;
      const contentObj =
        typeof lessonRecord.content === "object" && lessonRecord.content
          ? (lessonRecord.content as Record<string, unknown>)
          : undefined;
      const normalizedType = normalizeLessonType(lessonRecord.type, lessonRecord);
      const normalizedOptions = normalizeOptions(lessonRecord.options) ?? normalizeOptions(contentObj?.options);
      const normalizedExplanation =
        typeof lessonRecord.explanation === "string"
          ? lessonRecord.explanation
          : typeof contentObj?.explanation === "string"
            ? contentObj.explanation
            : undefined;
      const normalizedAnswerRaw = lessonRecord.correctAnswer ?? lessonRecord.answer ?? contentObj?.correctAnswer ?? contentObj?.answer;

      return {
        id: typeof lessonRecord.id === "string" && lessonRecord.id.trim().length > 0 ? lessonRecord.id : String(i + 1),
        type: normalizedType,
        content: normalizeContent(lessonRecord.content, lessonRecord, normalizedType),
        videoUrl: typeof lessonRecord.videoUrl === "string" ? lessonRecord.videoUrl : undefined,
        options: normalizedOptions,
        // AI sometimes returns correctAnswer as a letter ("C") instead of a number index
        correctAnswer: normalizeCorrectAnswer(normalizedAnswerRaw, normalizedOptions),
        explanation: normalizedExplanation,
      };
    });
  } catch {
    console.error("Failed to parse AI response:", cleaned);
    throw new AIServiceError("AI returned invalid JSON. Please try again.", 502);
  }
}

const generateWithGemini = async (truncatedText: string): Promise<string> => {
  if (!geminiApiKey) {
    throw new AIServiceError(`${AI_PROVIDER_NAME} API key is missing. Set GEMINI_API_KEY in your environment.`, 500, "missing_api_key");
  }
  const maxRetries = 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await Promise.race([
        openai.chat.completions.create({
          model: GEMINI_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `--- PDF CONTENT START ---\n${truncatedText}\n--- PDF CONTENT END ---` }
          ],
          max_completion_tokens: 900,
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new AIServiceError(`${AI_PROVIDER_NAME} request timed out.`, 504));
          }, GEMINI_TIMEOUT_MS);
        }),
      ]);
      const rawText = response.choices?.[0]?.message?.content?.trim();
      if (!rawText) {
        throw new AIServiceError(`${AI_PROVIDER_NAME} returned an empty response.`, 502);
      }
      return rawText;
    } catch (error: unknown) {
      const { status, code, message } = getErrorDetails(error);
      const retryAfterSeconds = getRetryAfterSeconds(error);
      const normalizedCode = (code ?? "").toLowerCase();
      const lowerMessage = message.toLowerCase();
      const isQuotaError =
        status === 402 ||
        normalizedCode === "insufficient_balance" ||
        (status === 429 &&
          (normalizedCode === "insufficient_quota" ||
            normalizedCode === "quota_exceeded" ||
            lowerMessage.includes("quota") ||
            lowerMessage.includes("insufficient")));
      const isRateLimited = status === 429;
      const isRetryable = !isQuotaError && (status >= 500 || status === 0);

      if (isQuotaError) {
        throw new AIServiceError(
          `${AI_PROVIDER_NAME} request was rejected. Check your API key and project quota/billing.`,
          status || 429,
          code,
          retryAfterSeconds
        );
      }

      if (isRateLimited) {
        throw new AIServiceError(
          `${AI_PROVIDER_NAME} rate limit hit. Please try again shortly.`,
          429,
          code,
          retryAfterSeconds
        );
      }

      if (attempt < maxRetries) {
        if (!isRetryable) {
          throw new AIServiceError(`${AI_PROVIDER_NAME} request failed. Check Gemini model name and API configuration.`, 400, code);
        }
        const delay = Math.min(4000, 800 * 2 ** (attempt - 1));
        console.log(`${AI_PROVIDER_NAME} API error. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        if (status >= 400 && status < 500) {
          throw new AIServiceError(`${AI_PROVIDER_NAME} request failed. Check Gemini model name and API configuration.`, 400, code);
        }
        throw new AIServiceError(`${AI_PROVIDER_NAME} service unavailable. Please try again.`, 503, code);
      }
    }
  }

  throw new AIServiceError("Failed to generate content after retries.", 503);
}

export const generateLessonsFromText = async (text: string): Promise<MicroLesson[]> => {
  // Truncate very long text to stay within token limits
  const maxChars = 10000;
  const truncatedText = text.length > maxChars
    ? text.substring(0, maxChars) + "\n\n[Content truncated for processing...]"
    : text;

  let rawText: string;

  try {
    rawText = await generateWithGemini(truncatedText);
  } catch (error: unknown) {
    console.error(`[AI] ${AI_PROVIDER_NAME} failed:`, error);
    console.warn("[AI] Using local fallback lesson generation.");
    const richFallback = buildRichFallbackLessonsFromPdf(truncatedText);
    const legacyFallback = buildLocalFallbackLessons(truncatedText);
    const selectedFallback = richFallback.length >= 6 ? richFallback : legacyFallback;
    return enforceLessonSubstance(
      ensurePdfGroundedMcqs(selectedFallback, truncatedText),
      truncatedText
    );
  }

  const parsed = parseLessons(rawText);
  const grounded = ensurePdfGroundedMcqs(parsed, truncatedText);
  const enriched = enforceLessonSubstance(grounded, truncatedText);
  const substanceFailures = enriched.filter((lesson) => isLowValueContent(lesson.content)).length;

  if (substanceFailures > Math.floor(enriched.length / 3)) {
    const richFallback = buildRichFallbackLessonsFromPdf(truncatedText);
    const legacyFallback = buildLocalFallbackLessons(truncatedText);
    const selectedFallback = richFallback.length >= 6 ? richFallback : legacyFallback;
    return enforceLessonSubstance(
      ensurePdfGroundedMcqs(selectedFallback, truncatedText),
      truncatedText
    );
  }

  return enriched;
}

export const generateAnswer = async (question: string, context: string): Promise<string> => {
  const prompt = `
You are a helpful and knowledgeable tutor for a micro-learning app.
The user is viewing a lesson with the following content:
"${context}"

The user has a question:
"${question}"

Please provide a concise, clear, and encouraging answer (max 3 sentences).
`;

  let rawText: string;
  const buildLocalFallbackAnswer = () => {
    const safeContext = context.replace(/\s+/g, " ").trim();
    const firstSentence =
      safeContext.split(/(?<=[.!?])\s+/).find((s) => s.trim().length > 20) ??
      safeContext.slice(0, 220);
    return `Quick take: ${firstSentence} Based on your question, focus on this core idea first, then I can break it down step by step.`;
  };

  try {
    if (!geminiApiKey) {
      throw new AIServiceError(`${AI_PROVIDER_NAME} API key is missing. Set GEMINI_API_KEY in your environment.`, 500, "missing_api_key");
    }
    const response = await openai.chat.completions.create({
      model: GEMINI_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 500,
    });
    rawText = response.choices?.[0]?.message?.content?.trim() || "";
  } catch (error: unknown) {
    const details = getErrorDetails(error);
    console.warn(
      `[AI] ${AI_PROVIDER_NAME} chat failed (${details.status}${details.code ? `/${details.code}` : ""}). Using local answer fallback.`
    );
    return buildLocalFallbackAnswer();
  }

  return rawText || buildLocalFallbackAnswer();
}
