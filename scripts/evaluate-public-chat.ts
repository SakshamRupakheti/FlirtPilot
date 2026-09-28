import { writeFileSync } from "node:fs";
import cases from "../data/chat-evaluation.json";
import { requestSchema, resultSchema } from "../lib/ai/schema";

// Explicitly run against your app: tsx scripts/evaluate-public-chat.ts URL report.json
// Sends only the checked-in synthetic test cases. No local chats or secrets read.
const [base, output] = process.argv.slice(2);
if (!base || !output) throw new Error("Supply an app origin and report path.");
const url = new URL("/api/reply", base);
if (
  url.protocol !== "https:" &&
  !["localhost", "127.0.0.1"].includes(url.hostname)
)
  throw new Error("Use HTTPS or a loopback app.");
const results = [];
for (const sample of cases.cases) {
  const started = Date.now();
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: url.origin },
    body: JSON.stringify(
      requestSchema.parse({
        message: sample.message,
        context: { situation: sample.context },
        action: "generate",
        skipQuestions: true,
        adultConfirmed: true,
      }),
    ),
    signal: AbortSignal.timeout(55000),
    redirect: "error",
  });
  const body: unknown = await response.json();
  const parsed = resultSchema.safeParse(body);
  const result = {
    id: sample.id,
    revision: response.headers.get("x-flirtpilot-revision"),
    httpStatus: response.status,
    elapsedMs: Date.now() - started,
    schemaValid: parsed.success,
    rubric: sample.checks,
    output: body,
  };
  results.push(result);
  writeFileSync(
    output,
    JSON.stringify(
      {
        evaluatedAt: new Date().toISOString(),
        origin: url.origin,
        review:
          "Schema checks only; assess each qualitative rubric separately. Not an A/B test or a success-rate estimate.",
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(result));
  if (!response.ok || !parsed.success) {
    process.exitCode = 1;
    break;
  }
}
