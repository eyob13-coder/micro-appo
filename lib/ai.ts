import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

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

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AIServiceError";
    this.status = status;
    this.code = code;
  }
}

const SYSTEM_PROMPT = `You are an expert educational content creator for a TikTok-style micro-learning app called Swipr.

Given text from a PDF, generate a series of micro-lessons. Each lesson should be ONE of:
1. **summary** — A single, punchy fact or insight (1-2 sentences max).
2. **mcq** — A multiple-choice question with 4 options, one correct answer, and a brief explanation.
3. **video** — A relevant short video topic (< 2 min).

Rules:
- Generate 6-10 lessons per batch
- Start with a "video" lesson if the content is technical or visual
- Alternate between types
- For "video" type, set "videoUrl" to a specific YouTube search query (e.g., "biology cell structure animation under 2 minutes")
- Keep language casual and engaging

Return ONLY valid JSON. Use this format:
[
  {
    "id": "1",
    "type": "video",
    "content": "Watch this quick intro to [Topic]",
    "videoUrl": "SEARCH: [Specific Search Query]"
  },
  {
    "id": "2",
    "type": "summary",
    "content": "Fact..."
  },
  ...
]`;

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const deepseekApiKey = readEnv("DEEPSEEK_API_KEY");
const deepseekBaseUrl = readEnv("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com/v1";
const openaiApiKey = readEnv("AI_INTEGRATIONS_OPENAI_API_KEY") ?? readEnv("OPENAI_API_KEY");
const openaiBaseUrl = readEnv("AI_INTEGRATIONS_OPENAI_BASE_URL");

const primaryProviderName = deepseekApiKey ? "DeepSeek" : "OpenAI";
const primaryApiKey = deepseekApiKey ?? openaiApiKey;
const primaryBaseUrl = deepseekApiKey ? deepseekBaseUrl : openaiBaseUrl;

const openai = new OpenAI({
  apiKey: primaryApiKey,
  baseURL: primaryBaseUrl || undefined,
});

const geminiApiKey = readEnv("GEMINI_API_KEY");
const gemini = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

const PRIMARY_MODEL = readEnv("OPENAI_MODEL") ?? (deepseekApiKey ? "deepseek-chat" : "gpt-5.1");
const GEMINI_MODEL = readEnv("GEMINI_MODEL") ?? "gemini-2.5-flash";

function getErrorDetails(error: unknown): { status: number; code?: string; message: string } {
  const maybeError = error as { status?: number; code?: string; message?: string };
  const status = typeof maybeError.status === "number" ? maybeError.status : 0;
  const code = typeof maybeError.code === "string" ? maybeError.code : undefined;
  const message = typeof maybeError.message === "string" ? maybeError.message : "Unknown AI provider error";
  return { status, code, message };
}

function stripTrailingCommas(jsonStr: string): string {
  // Remove trailing commas before } or ] (common LLM JSON mistake)
  return jsonStr.replace(/,\s*([\]}])/g, "$1");
}

function letterToIndex(letter: unknown): number | undefined {
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

function normalizeOptions(rawOptions: unknown): string[] | undefined {
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

function normalizeCorrectAnswer(rawAnswer: unknown, options?: string[]): number | undefined {
  const parsed = letterToIndex(rawAnswer);
  if (parsed === undefined) return undefined;
  if (parsed < 0) return undefined;
  if (options && parsed >= options.length) return undefined;
  return parsed;
}

function normalizeLessonType(rawType: unknown, lessonRecord: Record<string, unknown>): "summary" | "mcq" | "video" {
  if (rawType === "summary" || rawType === "mcq" || rawType === "video") return rawType;
  if (typeof lessonRecord.videoUrl === "string" && lessonRecord.videoUrl.length > 0) return "video";

  const contentObj = typeof lessonRecord.content === "object" && lessonRecord.content ? (lessonRecord.content as Record<string, unknown>) : null;
  if (normalizeOptions(lessonRecord.options)?.length || normalizeOptions(contentObj?.options)?.length) return "mcq";
  return "summary";
}

function normalizeContent(rawContent: unknown, lessonRecord: Record<string, unknown>, type: "summary" | "mcq" | "video"): string {
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

function parseLessons(rawText: string): MicroLesson[] {
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

async function generateWithOpenAI(truncatedText: string): Promise<string> {
  if (!primaryApiKey) {
    throw new AIServiceError(`${primaryProviderName} API key is missing.`, 503, "missing_api_key");
  }

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: PRIMARY_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `--- PDF CONTENT START ---\n${truncatedText}\n--- PDF CONTENT END ---` }
        ],
        max_completion_tokens: 2048,
      });
      const rawText = response.choices?.[0]?.message?.content?.trim();
      if (!rawText) {
        throw new AIServiceError(`${primaryProviderName} returned an empty response.`, 502);
      }
      return rawText;
    } catch (error: unknown) {
      const { status, code, message } = getErrorDetails(error);
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
      const isRetryable = !isQuotaError && (status === 429 || status >= 500);

      if (isQuotaError) {
        throw new AIServiceError(
          `${primaryProviderName} quota or balance exceeded. Add billing/credits, then retry.`,
          status || 429,
          code
        );
      }

      if (attempt < maxRetries) {
        if (!isRetryable) {
          throw new AIServiceError(`${primaryProviderName} request failed. Check API key and model access.`, 400, code);
        }
        const delay = Math.pow(2, attempt) * 1000; // exponential backoff
        console.log(`${primaryProviderName} API error. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        if (status === 429) {
          throw new AIServiceError(`${primaryProviderName} rate limit hit. Please try again shortly.`, 429, code);
        }
        if (status >= 400 && status < 500) {
          throw new AIServiceError(`${primaryProviderName} request failed. Check API key and model access.`, 400, code);
        }
        throw new AIServiceError(`${primaryProviderName} service unavailable. Please try again.`, 503, code);
      }
    }
  }

  throw new AIServiceError("Failed to generate content after retries.", 503);
}

async function generateWithGemini(truncatedText: string): Promise<string> {
  if (!gemini) {
    throw new AIServiceError("Gemini fallback is not configured. Set GEMINI_API_KEY.", 503, "gemini_not_configured");
  }

  try {
    const prompt = `${SYSTEM_PROMPT}\n\n--- PDF CONTENT START ---\n${truncatedText}\n--- PDF CONTENT END ---`;
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      throw new AIServiceError("Gemini returned an empty response.", 502, "empty_response");
    }
    return rawText;
  } catch (error: unknown) {
    const { status, code, message } = getErrorDetails(error);
    throw new AIServiceError(`Gemini fallback failed: ${message}`, status || 503, code ?? "gemini_error");
  }
}

function shouldFallbackToGemini(error: AIServiceError): boolean {
  return error.status === 400 || error.status === 402 || error.status === 429 || error.status === 503;
}

export async function generateLessonsFromText(text: string): Promise<MicroLesson[]> {
  // Truncate very long text to stay within token limits
  const maxChars = 30000;
  const truncatedText = text.length > maxChars
    ? text.substring(0, maxChars) + "\n\n[Content truncated for processing...]"
    : text;

  let rawText: string;

  try {
    rawText = await generateWithOpenAI(truncatedText);
  } catch (error: unknown) {
    console.error(`[AI] ${primaryProviderName} failed:`, error);
    if (error instanceof AIServiceError && gemini && shouldFallbackToGemini(error)) {
      console.warn(`${primaryProviderName} failed (${error.status}${error.code ? `/${error.code}` : ""}). Falling back to Gemini.`);
      rawText = await generateWithGemini(truncatedText);
    } else {
      throw error;
    }
  }

  return parseLessons(rawText);
}

export async function generateAnswer(question: string, context: string): Promise<string> {
  const prompt = `
You are a helpful and knowledgeable tutor for a micro-learning app.
The user is viewing a lesson with the following content:
"${context}"

The user has a question:
"${question}"

Please provide a concise, clear, and encouraging answer (max 3 sentences).
`;

  let rawText: string;

  try {
    // Reuse internal helpers if possible, or duplicate error handling briefly
    if (!primaryApiKey) throw new AIServiceError("API key missing", 503);

    // We can't reuse generateWithOpenAI easily because it prompts with system prompt + PDF content structure.
    // So we'll call openai directly here or modify generateWithOpenAI to accept messages.
    // For simplicity, let's call openai directly here. The retry logic is good though.
    // Actually, let's refactor generateWithOpenAI to take "messages" array?
    // Too risky to refactor heavily now.

    // Minimal direct call:
    if (primaryProviderName === "DeepSeek" || primaryProviderName === "OpenAI") {
      const response = await openai.chat.completions.create({
        model: PRIMARY_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 500,
      });
      rawText = response.choices?.[0]?.message?.content?.trim() || "";
    } else {
      throw new AIServiceError("Provider not supported for chat yet", 501);
    }

  } catch (error: unknown) {
    // Fallback to Gemini
    if (gemini) {
      try {
        const response = await gemini.models.generateContent({
          model: GEMINI_MODEL,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        rawText = response.text?.trim() || "";
      } catch (e) {
        throw new AIServiceError("Failed to generate answer", 500);
      }
    } else {
      throw new AIServiceError("Failed to generate answer", 500);
    }
  }

  return rawText;
}
