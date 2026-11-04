import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/reply/route";
import { requestSchema, resultSchema } from "../lib/ai/schema";
import { callProvider } from "../lib/ai/provider";
import { explicitBoundary } from "../lib/ai/boundaries";

const assessment = {
  status: "draft_check",
  summary: "A sexual jump from a neutral question could feel too forward.",
  confidence: "low",
  risk: 80,
  bluntness: 60,
  sexualForwardness: 90,
  evidence: ["Their message only asks where you are."],
  missingContext: "Have you already been flirting sexually?",
  recommendation: "Answer their question before escalating.",
  rewrite: "what are you up to?",
};
test("draft scores are bounded and explicit boundaries include the proposed reply", () => {
  assert.equal(resultSchema.safeParse(assessment).success, true);
  assert.equal(
    resultSchema.safeParse({ ...assessment, risk: 101 }).success,
    false,
  );
  assert.equal(
    resultSchema.safeParse({ ...assessment, confidence: "certain" }).success,
    false,
  );
  assert.equal(
    explicitBoundary(
      requestSchema.parse({
        message: "where are you?",
        draft: "I'm 16",
        context: {},
        action: "check",
        adultConfirmed: true,
      }),
    )?.status,
    "boundary",
  );
});
test("check endpoint preserves check action, validates draft, and rejects incompatible output", async () => {
  const original = globalThis.fetch;
  const saved = { ...process.env };
  process.env.AI_PROVIDER = "groq";
  process.env.GROQ_API_KEY = "test-only";
  const input = requestSchema.parse({
    message: "where are you?",
    draft: "you wanna come to my bed",
    context: {},
    action: "check",
    adultConfirmed: true,
  });
  const request = (data: unknown) =>
    new Request("https://example.com/api/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  let calls = 0;
  try {
    globalThis.fetch = async (_url, options) => {
      calls++;
      const payload = JSON.parse(String(options?.body));
      assert.equal(
        payload.response_format.json_schema.name,
        "flirtpilot_draft_check",
      );
      assert.deepEqual(
        payload.response_format.json_schema.schema.properties.result.anyOf.map(
          (branch: { properties: { status: { enum: string[] } } }) =>
            branch.properties.status.enum[0],
        ),
        ["draft_check", "boundary"],
      );
      const user = JSON.parse(payload.messages[1].content);
      assert.equal(user.action, "check");
      assert.equal(user.draft, input.draft);
      return Response.json({
        choices: [
          { message: { content: JSON.stringify({ result: assessment }) } },
        ],
      });
    };
    assert.equal((await POST(request({ ...input, draft: "" }))).status, 400);
    assert.equal(calls, 0);
    const response = await POST(request(input));
    assert.equal(response.status, 200);
    assert.equal(
      resultSchema.parse(await response.json()).status,
      "draft_check",
    );
    globalThis.fetch = async () =>
      Response.json({
        choices: [
          { message: { content: JSON.stringify({ result: assessment }) } },
        ],
      });
    await assert.rejects(
      callProvider({ ...input, action: "analyze" }),
      /INVALID_RESPONSE/,
    );
    globalThis.fetch = async () =>
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({ result: { ...assessment, risk: -1 } }),
            },
          },
        ],
      });
    assert.equal((await POST(request(input))).status, 502);
  } finally {
    globalThis.fetch = original;
    for (const key of ["AI_PROVIDER", "GROQ_API_KEY"]) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});
