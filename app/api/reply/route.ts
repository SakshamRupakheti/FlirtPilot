import { requestSchema } from "@/lib/ai/schema";
import { analyzeConversation } from "@/lib/ai/analyzeConversation";
import { generateReplies } from "@/lib/ai/generateReplies";
import { AIServiceError } from "@/lib/ai/provider";
import { allowRequest } from "@/lib/ai/rate-limit";
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers });
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return reply(
      { error: "This request couldn’t be verified. Refresh and try again." },
      403,
    );
  if (!request.headers.get("content-type")?.includes("application/json"))
    return reply({ error: "Please send a text conversation." }, 415);
  if (!allowRequest(request.headers.get("cf-connecting-ip") || "local"))
    return reply(
      { error: "Give your wingman a moment. Try again in a minute." },
      429,
    );
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: "Add a message first." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 40000) {
        await reader.cancel();
        return reply(
          {
            error: "That conversation is a little long. Try a shorter excerpt.",
          },
          413,
        );
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return reply({ error: "Please check your message and try again." }, 400);
    }
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success)
      return reply(
        { error: "Confirm everyone is 18+ and check your message length." },
        400,
      );
    const result = await (
      parsed.data.action === "generate" ? generateReplies : analyzeConversation
    )(parsed.data);
    return reply(result);
  } catch (error) {
    if (error instanceof AIServiceError && error.code === "QUOTA_EXHAUSTED")
      return reply(
        {
          error:
            "Your wingman is temporarily unavailable. The app owner needs to top up the AI service. Your message is still here.",
        },
        503,
      );
    if (error instanceof AIServiceError && error.code === "NOT_CONFIGURED")
      return reply(
        {
          error:
            "Your wingman isn’t connected yet. The app owner needs to configure the AI provider.",
        },
        503,
      );
    return reply(
      { error: "My wingman brain froze for a second. Try again." },
      502,
    );
  }
}
