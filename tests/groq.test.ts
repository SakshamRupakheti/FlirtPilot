import test from "node:test";
import assert from "node:assert/strict";
import { callProvider, AIServiceError } from "../lib/ai/provider";
import { isHostedPreview } from "../lib/ai/deployment";
import { requestSchema } from "../lib/ai/schema";
import { POST } from "../app/api/reply/route";

test("Groq uses separate server credentials, strict JSON, no paid fallback, and graceful free limits", async () => {
  const original = globalThis.fetch;
  const saved = { ...process.env };
  const input = requestSchema.parse({
    message: "Should I double text?",
    adultConfirmed: true,
    context: {},
  });
  try {
    process.env.VERCEL = "1";
    process.env.AI_PROVIDER = "groq";
    process.env.AI_API_KEY = "must-not-use-openai-key";
    delete process.env.GROQ_API_KEY;
    delete process.env.Groq;
    delete process.env.GROQ_MODEL;
    assert.equal(isHostedPreview(), true);
    await assert.rejects(
      callProvider(input),
      (error: unknown) =>
        error instanceof AIServiceError && error.code === "NOT_CONFIGURED",
    );
    process.env.GROQ_API_KEY = "test-groq-key";
    assert.equal(isHostedPreview(), false);
    globalThis.fetch = async (url, options) => {
      assert.equal(
        String(url),
        "https://api.groq.com/openai/v1/chat/completions",
      );
      assert.equal(
        new Headers(options?.headers).get("Authorization"),
        "Bearer test-groq-key",
      );
      assert.equal(options?.redirect, "manual");
      const body = JSON.parse(String(options?.body));
      assert.match(body.messages[0].content, /not proof of rejection/);
      assert.doesNotMatch(
        body.messages[0].content,
        /You are a pure Gen Z speaker/,
      );
      assert.equal(body.model, "openai/gpt-oss-20b");
      assert.equal(body.response_format.json_schema.strict, true);
      assert.equal(body.reasoning_effort, "low");
      assert.equal(body.store, undefined);
      return Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                result: {
                  status: "questions",
                  contextQuestions: [
                    {
                      id: "before",
                      question: "What did you say before?",
                      options: [],
                    },
                  ],
                },
              }),
            },
          },
        ],
      });
    };
    assert.equal((await callProvider(input)).status, "questions");
    delete process.env.GROQ_API_KEY;
    process.env.Groq = "test-groq-key";
    assert.equal(isHostedPreview(), false);
    assert.equal((await callProvider(input)).status, "questions");
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return Response.json(
        { error: "private upstream detail" },
        { status: 429 },
      );
    };
    const response = await POST(
      new Request("https://example.com/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
    assert.equal(response.status, 429);
    assert.equal(calls, 1);
    assert.ok(!(await response.text()).includes("private upstream detail"));
  } finally {
    globalThis.fetch = original;
    for (const key of [
      "VERCEL",
      "AI_PROVIDER",
      "AI_API_KEY",
      "GROQ_API_KEY",
      "GROQ_MODEL",
      "Groq",
    ]) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});
