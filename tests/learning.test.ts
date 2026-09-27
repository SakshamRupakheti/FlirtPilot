import test from "node:test";
import assert from "node:assert/strict";
import {
  learningExampleSchema,
  selectExamples,
  exportDataset,
  redactCommonIdentifiers,
  saveExamples,
  readExamples,
} from "../lib/learning";
import { requestSchema } from "../lib/ai/schema";

const example = learningExampleSchema.parse({
  id: "00000000-0000-4000-8000-000000000001",
  createdAt: "2026-09-27T00:00:00.000Z",
  conversation: "Me: coffee? Them: maybe",
  preferredReply: "no rush, let me know",
  lesson: "Maybe is uncertain, not acceptance.",
  group: "person-01",
  split: "practice",
  source: "typed",
  consent: { version: 1, adults: true, reviewed: true, share: false },
});
test("unreviewed examples are rejected and learning is absent by default", () => {
  assert.equal(
    learningExampleSchema.safeParse({
      ...example,
      consent: { ...example.consent, reviewed: false },
    }).success,
    false,
  );
  assert.deepEqual(
    requestSchema.parse({ message: "hi", context: {}, adultConfirmed: true })
      .learningExamples,
    [],
  );
});
test("evaluation examples never enter guidance and private examples never enter dataset exports", () => {
  const evaluation = { ...example, split: "evaluation" as const };
  assert.deepEqual(selectExamples([evaluation], "coffee"), []);
  assert.equal(exportDataset([example], "practice"), "");
  const shared = { ...example, consent: { ...example.consent, share: true } };
  const record = JSON.parse(exportDataset([shared], "practice"));
  assert.equal(record.messages[1].content, example.preferredReply);
  assert.equal(exportDataset([shared], "evaluation"), "");
  assert.equal(selectExamples([example], "coffee").length, 1);
  assert.equal(selectExamples([example], "unrelated").length, 0);
  assert.equal("consent" in selectExamples([example], "coffee")[0], false);
});
test("common identifier removal preserves conversational words", () => {
  assert.equal(
    redactCommonIdentifiers(
      "hi @someone email a@example.com +1 555 123 4567 https://example.com",
    ),
    "hi [handle] email [email] [phone] [link]",
  );
});
test("storage rejects split leakage and malformed data without overwriting it", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let stored: string | null = null;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: () => stored,
      setItem: (_key: string, value: string) => {
        stored = value;
      },
    },
  });
  try {
    saveExamples([example]);
    assert.equal(readExamples().length, 1);
    assert.throws(() =>
      saveExamples([example, { ...example, split: "evaluation" }]),
    );
    assert.equal(readExamples().length, 1);
    stored = "invalid";
    assert.throws(() => readExamples());
    assert.equal(stored, "invalid");
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
