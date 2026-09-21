import test from "node:test";
import assert from "node:assert/strict";
import { requestSchema, resultSchema } from "../lib/ai/schema";
import { callProvider, AIServiceError } from "../lib/ai/provider";
import { allowRequest } from "../lib/ai/rate-limit";
import { POST } from "../app/api/reply/route";
const input = requestSchema.parse({
  message: "haha maybe 😭",
  context: { goal: "Go on a date" },
  adultConfirmed: true,
});
const complete = {
  status: "complete",
  interpretation: {
    summary: "Could be teasing; context matters.",
    confidence: "low",
  },
  signals: [
    { label: "Ambiguous answer", evidence: "maybe leaves the plan open" },
  ],
  strategy: "Offer a low-pressure plan.",
  replies: {
    safe: {
      text: "coffee saturday? no pressure",
      reason: "Specific and easy to decline.",
    },
    bold: {
      text: "i’m taking you to my favorite coffee spot if you’re in",
      reason: "Expresses interest.",
    },
    risky: {
      text: "i’ll risk the coffee snob judgment. saturday?",
      reason: "Playful without pressure.",
    },
  },
};
test("requires adulthood and bounds input", () => {
  assert.equal(
    requestSchema.safeParse({ ...input, adultConfirmed: false }).success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({ ...input, message: "a".repeat(12001) }).success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({ ...input, message: "  " }).success,
    false,
  );
});
test("rejects missing replies and malformed signals", () => {
  assert.ok(resultSchema.safeParse(complete).success);
  assert.equal(
    resultSchema.safeParse({
      ...complete,
      replies: { safe: complete.replies.safe },
    }).success,
    false,
  );
  assert.equal(
    resultSchema.safeParse({ ...complete, signals: ["invented"] }).success,
    false,
  );
});
test("questions leave room for the goal selector within four total questions", () => {
  assert.equal(
    resultSchema.safeParse({
      status: "questions",
      contextQuestions: Array(5).fill({
        id: "goal",
        question: "Goal?",
        options: [],
      }),
    }).success,
    false,
  );
});
test("bounded rate limiter recovers after a minute", () => {
  for (let i = 0; i < 15; i++) assert.ok(allowRequest("test", 1000));
  assert.equal(allowRequest("test", 1000), false);
  assert.ok(allowRequest("test", 61001));
});
test("server rejects invalid origin and malformed JSON without provider calls", async () => {
  const origin = await POST(
    new Request("https://flirtpilot.test/api/reply", {
      method: "POST",
      headers: {
        origin: "https://attacker.test",
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }),
  );
  assert.equal(origin.status, 403);
  const bad = await POST(
    new Request("https://flirtpilot.test/api/reply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    }),
  );
  assert.equal(bad.status, 400);
  const tooBig = await POST(
    new Request("https://flirtpilot.test/api/reply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "x".repeat(41000),
    }),
  );
  assert.equal(tooBig.status, 413);
});
test("provider contract: context, feedback, strict schema, privacy and failure handling", async () => {
  const original = globalThis.fetch;
  const oldKey = process.env.AI_API_KEY,
    oldModel = process.env.AI_MODEL;
  try {
    delete process.env.AI_API_KEY;
    await assert.rejects(
      callProvider(input),
      (e: unknown) =>
        e instanceof AIServiceError && e.code === "NOT_CONFIGURED",
    );
    process.env.AI_API_KEY = "test-only-not-a-real-key";
    process.env.AI_MODEL = "gpt-5-mini";
    const withFeedback = {
      ...input,
      feedback: [
        {
          type: "too_cringe" as const,
          tier: "bold" as const,
          text: "rejected reply",
        },
      ],
    };
    globalThis.fetch = async (_url, options) => {
      const body = JSON.parse(options?.body as string);
      assert.equal(body.store, false);
      assert.equal(body.response_format.json_schema.strict, true);
      assert.deepEqual(
        JSON.parse(body.messages[1].content).feedback,
        withFeedback.feedback,
      );
      return Response.json({
        choices: [
          { message: { content: JSON.stringify({ result: complete }) } },
        ],
      });
    };
    assert.equal((await callProvider(withFeedback)).status, "complete");
    globalThis.fetch = async () =>
      Response.json({
        choices: [{ message: { content: '{"result":{"status":"complete"}}' } }],
      });
    await assert.rejects(
      callProvider(input),
      (e: unknown) =>
        e instanceof AIServiceError && e.code === "INVALID_RESPONSE",
    );
    globalThis.fetch = async () =>
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                result: {
                  status: "questions",
                  contextQuestions: [
                    { id: "goal", question: "Goal?", options: [] },
                  ],
                },
              }),
            },
          },
        ],
      });
    await assert.rejects(callProvider({ ...input, skipQuestions: true }));
    globalThis.fetch = async () =>
      Response.json(
        { error: { message: "secret upstream detail" } },
        { status: 429 },
      );
    const response = await POST(
      new Request("https://flirtpilot.test/api/reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
    assert.equal(response.status, 502);
    assert.equal(
      (await response.text()).includes("secret upstream detail"),
      false,
    );
    globalThis.fetch = async () =>
      Response.json(
        {
          error: {
            type: "insufficient_quota",
            code: "credit_balance_exhausted",
            message: "private billing detail",
          },
        },
        { status: 429 },
      );
    const exhausted = await POST(
      new Request("https://flirtpilot.test/api/reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
    assert.equal(exhausted.status, 503);
    const exhaustedText = await exhausted.text();
    assert.ok(exhaustedText.includes("top up"));
    assert.equal(exhaustedText.includes("private billing detail"), false);
  } finally {
    globalThis.fetch = original;
    if (oldKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = oldKey;
    if (oldModel === undefined) delete process.env.AI_MODEL;
    else process.env.AI_MODEL = oldModel;
  }
});
