import { resultSchema, type ReplyRequest } from "./schema";
import { SYSTEM_PROMPT } from "./prompt";
import { outputFormat } from "./structured-output";
import { LOCAL_SYSTEM_PROMPT } from "./local-prompt";
import { explicitBoundary } from "./boundaries";
export class AIServiceError extends Error {
  constructor(
    public code:
      | "NOT_CONFIGURED"
      | "QUOTA_EXHAUSTED"
      | "FREE_LIMIT_REACHED"
      | "UNAVAILABLE"
      | "INVALID_RESPONSE"
      | "LOCAL_UNAVAILABLE"
      | "INPUT_TOO_LONG",
  ) {
    super(code);
  }
}
export async function callProvider(input: ReplyRequest) {
  const boundary = explicitBoundary(input);
  if (boundary) return boundary;
  if (process.env.AI_PROVIDER === "ollama") return callLocalProvider(input);
  const groq = process.env.AI_PROVIDER === "groq";
  if (process.env.AI_PROVIDER && process.env.AI_PROVIDER !== "openai" && !groq)
    throw new AIServiceError("NOT_CONFIGURED");
  const key = groq
      ? process.env.GROQ_API_KEY || process.env.Groq
      : process.env.AI_API_KEY,
    model = groq
      ? process.env.GROQ_MODEL || "openai/gpt-oss-20b"
      : process.env.AI_MODEL;
  if (!key || !model) throw new AIServiceError("NOT_CONFIGURED");
  const base = groq
    ? "https://api.groq.com/openai/v1"
    : process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const url = new URL(base.replace(/\/$/, "") + "/chat/completions");
  if (url.protocol !== "https:" && process.env.NODE_ENV === "production")
    throw new AIServiceError("NOT_CONFIGURED");
  try {
    const response = await fetch(url, {
      method: "POST",
      redirect: "manual",
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
        max_completion_tokens: groq ? 2400 : 5000,
        ...(groq || model.startsWith("gpt-5")
          ? { reasoning_effort: "low" }
          : {}),
        ...(!groq ? { store: false } : {}),
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) {
      if (groq && response.status === 429)
        throw new AIServiceError("FREE_LIMIT_REACHED");
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

async function callLocalProvider(input: ReplyRequest) {
  // Local mode never receives credentials or falls back to a cloud provider.
  const url = new URL(process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434");
  if (
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
    url.username ||
    url.password
  )
    throw new AIServiceError("NOT_CONFIGURED");
  url.pathname = "/api/chat";
  url.search = "";
  url.hash = "";
  const payload = JSON.stringify(input);
  // Keep the small local context window from silently losing instructions.
  if (new TextEncoder().encode(payload).length > 6000)
    throw new AIServiceError("INPUT_TOO_LONG");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // workerd supports manual/follow, but not the Fetch "error" mode.
      // Reject 3xx below without following them outside the local machine.
      redirect: "manual",
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || "qwen3:4b-instruct-2507-q4_K_M",
        stream: false,
        think: false,
        keep_alive: "10m",
        format: outputFormat.json_schema.schema,
        options: { num_ctx: 8192, num_predict: 1600, temperature: 0.7 },
        messages: [
          {
            role: "system",
            content: LOCAL_SYSTEM_PROMPT,
          },
          { role: "user", content: payload },
        ],
      }),
      signal: AbortSignal.timeout(180000),
    });
    if (!response.ok) throw new AIServiceError("LOCAL_UNAVAILABLE");
    const data = (await response.json()) as {
      message?: { content?: string };
      done_reason?: string;
    };
    if (!data.message?.content || data.done_reason === "length")
      throw new AIServiceError("INVALID_RESPONSE");
    let raw: unknown;
    try {
      raw = JSON.parse(data.message.content).result;
    } catch {
      throw new AIServiceError("INVALID_RESPONSE");
    }
    const parsed = resultSchema.safeParse(raw);
    if (
      !parsed.success ||
      ((input.skipQuestions || input.action === "generate") &&
        parsed.data.status === "questions")
    )
      throw new AIServiceError("INVALID_RESPONSE");
    return parsed.data;
  } catch (error) {
    if (error instanceof AIServiceError) throw error;
    throw new AIServiceError("LOCAL_UNAVAILABLE");
  }
}
