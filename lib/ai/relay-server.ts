import { createServer } from "node:http";
import { z } from "zod";
import { createHash, timingSafeEqual } from "node:crypto";
import { requestSchema } from "./schema";
import { callProvider, AIServiceError } from "./provider";

export function createRelayServer(
  token: string,
  origin: string,
  generate = callProvider,
) {
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new Error("A random 256-bit relay token is required.");
  const expected = createHash("sha256").update(`Bearer ${token}`).digest();
  let busy = false,
    requests = 0,
    windowStart = Date.now();
  return createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Vary", "Origin");
    const send = (status: number, data: unknown) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    };
    if (req.headers.origin && req.headers.origin !== origin)
      return send(403, {
        error: "This website is not allowed to use the laptop.",
      });
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type",
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (!["/health", "/api/reply"].includes(req.url || ""))
      return send(404, { error: "Not found." });
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    const actual = createHash("sha256")
      .update(req.headers.authorization || "")
      .digest();
    if (!timingSafeEqual(actual, expected))
      return send(401, {
        error: "A valid laptop connection code is required.",
      });
    if (req.url === "/health" && req.method === "GET") {
      try {
        const result = await fetch("http://127.0.0.1:11434/api/tags", {
          redirect: "manual",
          signal: AbortSignal.timeout(4000),
        });
        const data = z
          .object({ models: z.array(z.object({ name: z.string() })) })
          .parse(await result.json());
        const ready =
          result.ok &&
          data.models?.some(
            (model: { name: string }) =>
              model.name ===
              (process.env.OLLAMA_MODEL || "qwen3:4b-instruct-2507-q4_K_M"),
          );
        return send(ready ? 200 : 503, {
          service: "flirtpilot-local",
          ready: Boolean(ready),
        });
      } catch {
        return send(503, { error: "Start Ollama on your laptop." });
      }
    }
    if (req.url !== "/api/reply" || req.method !== "POST")
      return send(405, { error: "Method not allowed." });
    if (!req.headers["content-type"]?.includes("application/json"))
      return send(415, { error: "Send a text conversation." });
    if (Date.now() - windowStart > 60000) {
      requests = 0;
      windowStart = Date.now();
    }
    if (busy || ++requests > 8)
      return send(429, {
        error: "Your laptop is working on a reply. Try again in a moment.",
      });
    busy = true;
    try {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 12000) {
          send(413, { error: "Try a shorter conversation excerpt." });
          req.resume();
          return;
        }
        chunks.push(chunk);
      }
      let raw: unknown;
      try {
        raw = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        return send(400, { error: "Check your message and try again." });
      }
      const parsed = requestSchema.safeParse(raw);
      if (!parsed.success)
        return send(400, {
          error: "Confirm everyone is 18+ and check your message.",
        });
      if (process.env.AI_PROVIDER !== "ollama")
        return send(503, { error: "This bridge only supports local Ollama." });
      send(200, await generate(parsed.data));
    } catch (error) {
      send(503, {
        error:
          error instanceof AIServiceError && error.code === "INPUT_TOO_LONG"
            ? "Your laptop works best with a shorter conversation excerpt."
            : "Your laptop couldn’t finish that reply. Check Ollama and try again. Your message is still here.",
      });
    } finally {
      busy = false;
    }
  });
}
