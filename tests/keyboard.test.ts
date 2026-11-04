import test from "node:test";
import assert from "node:assert/strict";
import {
  keyboardRequest,
  keyboardResult,
  suggestKeyboard,
} from "../lib/ai/keyboard";
import { POST } from "../app/api/keyboard/route";

const input = {
  draft: "want to get coffee?",
  mode: "rewrite" as const,
  adultConfirmed: true as const,
  theirMessage: "",
  vibe: "Chill" as const,
};
test("keyboard requests require adulthood, bounded input and mode-specific text", () => {
  assert.equal(
    keyboardResult.safeParse({
      status: "suggestions",
      suggestions: ["relaxed", "confident", "playful"],
    }).success,
    false,
  );
  assert.ok(keyboardRequest.safeParse(input).success);
  for (const invalid of [
    { ...input, adultConfirmed: false },
    { ...input, draft: "" },
    { ...input, mode: "reply" },
    { ...input, draft: "a".repeat(501) },
  ])
    assert.equal(keyboardRequest.safeParse(invalid).success, false);
});
test("keyboard endpoint rejects missing device auth, streams oversized bodies safely and returns real model results", async () => {
  const original = globalThis.fetch;
  const saved = { ...process.env };
  const request = (body: string, authorization = "Bearer " + "a".repeat(32)) =>
    new Request("https://flirtpilot.test/api/keyboard", {
      method: "POST",
      headers: { "content-type": "application/json", authorization },
      body,
    });
  try {
    delete process.env.KEYBOARD_ACCESS_TOKEN;
    assert.equal((await POST(request(JSON.stringify(input)))).status, 503);
    process.env.KEYBOARD_ACCESS_TOKEN = "a".repeat(32);
    assert.equal(
      (await POST(request(JSON.stringify(input), "Bearer wrong"))).status,
      401,
    );
    assert.equal((await POST(request("a".repeat(6001)))).status, 413);
    assert.equal((await POST(request("{"))).status, 400);
    assert.equal(
      (await POST(request(JSON.stringify({ ...input, adultConfirmed: false }))))
        .status,
      400,
    );
    process.env.AI_PROVIDER = "ollama";
    process.env.OLLAMA_BASE_URL = "http://127.0.0.1:11434";
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "http://127.0.0.1:11434/api/chat");
      assert.equal(options?.redirect, "manual");
      assert.equal(new Headers(options?.headers).has("authorization"), false);
      const body = JSON.parse(String(options?.body));
      assert.equal(body.options.num_ctx, 4096);
      assert.equal(body.options.num_predict, 240);
      assert.ok(
        !String(options?.body).includes(process.env.KEYBOARD_ACCESS_TOKEN!),
      );
      return Response.json({
        message: {
          content: JSON.stringify({
            result: {
              status: "suggestions",
              suggestions: [
                "coffee this weekend?",
                "i'd like to take you for coffee",
                "let's settle the best coffee debate",
              ],
            },
          }),
        },
        done_reason: "stop",
      });
    };
    const response = await POST(request(JSON.stringify(input)));
    assert.equal(response.status, 200);
    const result = (await response.json()) as { suggestions: string[] };
    assert.equal(result.suggestions.length, 3);
    globalThis.fetch = async () => {
      throw new Error("must not call model");
    };
    const boundary = await suggestKeyboard({
      ...input,
      mode: "reply",
      draft: "",
      theirMessage: "Don't contact me again",
    });
    assert.equal(boundary.status, "boundary");
    globalThis.fetch = async () =>
      Response.json({ done_reason: "length", message: { content: "{}" } });
    await assert.rejects(suggestKeyboard(input), /INVALID_RESPONSE/);
    globalThis.fetch = async () =>
      Response.json({
        message: {
          content:
            '{"result":{"status":"suggestions","suggestions":["only one"]}}',
        },
      });
    await assert.rejects(suggestKeyboard(input), /INVALID_RESPONSE/);
    process.env.OLLAMA_BASE_URL = "https://external.test";
    await assert.rejects(suggestKeyboard(input), /NOT_CONFIGURED/);
    process.env.AI_PROVIDER = "openai";
    await assert.rejects(suggestKeyboard(input), /NOT_CONFIGURED/);
  } finally {
    globalThis.fetch = original;
    for (const key of [
      "KEYBOARD_ACCESS_TOKEN",
      "AI_PROVIDER",
      "OLLAMA_BASE_URL",
    ]) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});
