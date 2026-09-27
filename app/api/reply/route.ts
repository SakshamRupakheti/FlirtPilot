import { requestSchema } from "@/lib/ai/schema";
import { analyzeConversation } from "@/lib/ai/analyzeConversation";
import { generateReplies } from "@/lib/ai/generateReplies";
import { AIServiceError } from "@/lib/ai/provider";
import { allowRequest } from "@/lib/ai/rate-limit";
import { isHostedPreview } from "@/lib/ai/deployment";
export const maxDuration = 60;
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-FlirtPilot-Revision":
    process.env.VERCEL_GIT_COMMIT_SHA || "local-development",
};
const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers });
export async function POST(request: Request) {
  if (isHostedPreview())
    return reply(
      {
        error:
          "Your wingman is waiting for its hosted AI connection. The app owner needs to finish server setup. No laptop connection is needed.",
      },
      503,
    );
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
    if (error instanceof AIServiceError && error.code === "FREE_LIMIT_REACHED")
      return reply(
        {
          error:
            "Our free AI allowance is resting. Try again later; your message is still here.",
        },
        429,
      );
    if (error instanceof AIServiceError && error.code === "INPUT_TOO_LONG")
      return reply(
        {
          error:
            "Your local wingman works best with a short excerpt. Shorten the conversation or context and try again.",
        },
        413,
      );
    if (error instanceof AIServiceError && error.code === "LOCAL_UNAVAILABLE")
      return reply(
        {
          error:
            "Your local wingman couldn’t connect. Start Ollama on this computer and check that the model is downloaded. Your message is still here.",
        },
        503,
      );
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
