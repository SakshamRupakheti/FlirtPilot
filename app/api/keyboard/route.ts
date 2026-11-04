import { keyboardRequest, suggestKeyboard } from "@/lib/ai/keyboard";
import { allowRequest } from "@/lib/ai/rate-limit";
import { AIServiceError } from "@/lib/ai/provider";
export const maxDuration = 60;
const reply = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

export async function POST(request: Request) {
  if (process.env.VERCEL === "1")
    return reply(
      {
        error:
          "Phone AI needs a separately connected inference server. This deployment is a website preview.",
      },
      503,
    );
  // Opt-in, separate device credential; never distribute an AI provider key.
  const token = process.env.KEYBOARD_ACCESS_TOKEN;
  if (!token || token.length < 32)
    return reply(
      { error: "Keyboard AI is not configured on this server." },
      503,
    );
  const supplied =
    request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (supplied.length > 512)
    return reply(
      { error: "Reconnect your keyboard in the FlirtPilot app." },
      401,
    );
  const hashes = await Promise.all(
    [supplied, token].map((value) =>
      crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  );
  let difference = 0;
  const actual = new Uint8Array(hashes[0]),
    expected = new Uint8Array(hashes[1]);
  for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i];
  if (difference)
    return reply(
      { error: "Reconnect your keyboard in the FlirtPilot app." },
      401,
    );
  if (!request.headers.get("content-type")?.includes("application/json"))
    return reply({ error: "Expected a text request." }, 415);
  if (!allowRequest("keyboard-device"))
    return reply(
      { error: "Give your wingman a moment before trying again." },
      429,
    );
  const reader = request.body?.getReader();
  if (!reader) return reply({ error: "Add a draft or their message." }, 400);
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 6000) {
        await reader.cancel();
        return reply({ error: "Use a shorter excerpt." }, 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return reply({ error: "Check the message and try again." }, 400);
    }
    const parsed = keyboardRequest.safeParse(raw);
    if (!parsed.success)
      return reply(
        {
          error:
            "Confirm both people are adults and use at most 500 characters per field.",
        },
        400,
      );
    return reply(await suggestKeyboard(parsed.data, request.signal));
  } catch (error) {
    if (error instanceof AIServiceError && error.code === "INPUT_TOO_LONG")
      return reply({ error: "Use a shorter excerpt." }, 413);
    return reply(
      {
        error:
          "Your wingman couldn’t finish. Try again; typing still works offline.",
      },
      503,
    );
  }
}
