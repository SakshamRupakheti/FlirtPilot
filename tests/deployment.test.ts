import test from "node:test";
import assert from "node:assert/strict";
import { POST as reply } from "../app/api/reply/route";
import { POST as keyboard } from "../app/api/keyboard/route";

test("hosted local-AI previews reject inference without contacting the laptop", async () => {
  const original = {
    VERCEL: process.env.VERCEL,
    AI_PROVIDER: process.env.AI_PROVIDER,
  };
  const fetch = globalThis.fetch;
  process.env.VERCEL = "1";
  process.env.AI_PROVIDER = "ollama";
  globalThis.fetch = async () => {
    throw new Error("Preview must not contact a model");
  };
  try {
    for (const handler of [reply, keyboard]) {
      const result = await handler(
        new Request("https://example.com/api/reply", { method: "POST" }),
      );
      assert.equal(result.status, 503);
    }
  } finally {
    globalThis.fetch = fetch;
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
