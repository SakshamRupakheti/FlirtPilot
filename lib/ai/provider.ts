import { resultSchema, type ReplyRequest } from "./schema";
import { SYSTEM_PROMPT } from "./prompt";
import { outputFormat } from "./structured-output";
export class AIServiceError extends Error {
  constructor(
    public code:
      "NOT_CONFIGURED" | "QUOTA_EXHAUSTED" | "UNAVAILABLE" | "INVALID_RESPONSE",
  ) {
    super(code);
  }
}
export async function callProvider(input: ReplyRequest) {
  const key = process.env.AI_API_KEY,
    model = process.env.AI_MODEL;
  if (!key || !model) throw new AIServiceError("NOT_CONFIGURED");
  const base = process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const url = new URL(base.replace(/\/$/, "") + "/chat/completions");
  if (url.protocol !== "https:" && process.env.NODE_ENV === "production")
    throw new AIServiceError("NOT_CONFIGURED");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              SYSTEM_PROMPT + '\nWrap your chosen response in {"result": ...}.',
          },
          { role: "user", content: JSON.stringify(input) },
        ],
        response_format: outputFormat,
        max_completion_tokens: 5000,
        ...(model.startsWith("gpt-5") ? { reasoning_effort: "low" } : {}),
        store: false,
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) {
      const failure: unknown = await response.json().catch(() => null);
      if (
        response.status === 429 &&
        failure &&
        typeof failure === "object" &&
        "error" in failure
      ) {
        const detail = failure.error;
        if (
          detail &&
          typeof detail === "object" &&
          (("type" in detail && detail.type === "insufficient_quota") ||
            ("code" in detail &&
              ["insufficient_quota", "credit_balance_exhausted"].includes(
                String(detail.code),
              )))
        ) {
          throw new AIServiceError("QUOTA_EXHAUSTED");
        }
      }
      throw new AIServiceError("UNAVAILABLE");
    }
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new AIServiceError("INVALID_RESPONSE");
    const result = resultSchema.safeParse(JSON.parse(content).result);
    if (!result.success) throw new AIServiceError("INVALID_RESPONSE");
    if (
      (input.skipQuestions || input.action === "generate") &&
      result.data.status === "questions"
    )
      throw new AIServiceError("INVALID_RESPONSE");
    return result.data;
  } catch (error) {
    if (error instanceof AIServiceError) throw error;
    throw new AIServiceError("UNAVAILABLE");
  }
}
