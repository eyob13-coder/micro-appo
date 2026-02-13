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

const SYSTEM_PROMPT = `You are an expert educational content creator for a TikTok-style micro-learning app called MicroLearn.

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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function generateLessonsFromText(text: string): Promise<MicroLesson[]> {
  // Truncate very long text to stay within token limits
  const maxChars = 30000;
  const truncatedText = text.length > maxChars
    ? text.substring(0, maxChars) + "\n\n[Content truncated for processing...]"
    : text;

  const maxRetries = 3;
  let response: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `--- PDF CONTENT START ---\n${truncatedText}\n--- PDF CONTENT END ---` }
        ],
        max_completion_tokens: 2048,
      });
      break;
    } catch (error: any) {
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // exponential backoff
        console.log(`OpenAI API error. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  if (!response) {
    throw new Error("Failed to generate content after retries.");
  }

  const rawText = response.choices?.[0]?.message?.content?.trim() || "[]";

  // Remove code fences if present
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const lessons: MicroLesson[] = JSON.parse(cleaned);
    return lessons.map((lesson, i) => ({
      ...lesson,
      id: lesson.id || String(i + 1),
    }));
  } catch {
    console.error("Failed to parse AI response:", cleaned);
    throw new Error("AI returned invalid JSON. Please try again.");
  }
}
