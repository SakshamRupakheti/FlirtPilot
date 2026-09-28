import test from "node:test";
import assert from "node:assert/strict";
import library from "../data/curated-chat.json";
import evaluation from "../data/chat-evaluation.json";
import {
  selectPublicExamples,
  publicExampleGuide,
} from "../lib/ai/curated-examples";

test("public examples are relevant, bounded, and exclude source personas and metadata", () => {
  const selected = selectPublicExamples({
    message: "Should I double text?",
    draft: "",
  });
  assert.equal(selected.length, 1);
  assert.match(selected[0].lesson, /not proof of rejection/);
  assert.deepEqual(Object.keys(selected[0]).sort(), [
    "illustrativeReply",
    "lesson",
    "situation",
  ]);
  assert.equal(
    selectPublicExamples({ message: "kal kaha gayab thi 😭", draft: "" })
      .length,
    0,
  );
  assert.equal(
    selectPublicExamples({ message: "text firstly", draft: "" }).length,
    0,
  );
  assert.equal(
    selectPublicExamples({
      message: "double text, text first, are you mad, risky reply",
      draft: "",
    }).length,
    2,
  );
  assert.equal(
    selectPublicExamples({ message: "What I’m doing later?", draft: "" })
      .length,
    1,
  );
  assert.ok(
    publicExampleGuide({ message: "are you mad", draft: "" }).length < 2200,
  );
});

test("reviewed library has unique provenance and evaluation source situations remain excluded", () => {
  assert.equal(
    new Set(library.examples.map((e) => e.id)).size,
    library.examples.length,
  );
  for (const example of library.examples) {
    assert.ok(
      example.sourceLine > 0 &&
        example.sourcePrompt &&
        example.lesson &&
        example.reply,
    );
    assert.ok(example.lesson.length < 600 && example.reply.length < 300);
    assert.ok(
      !evaluation.cases.some((e) => e.sourceLine === example.sourceLine),
    );
  }
  const saved = process.env.AI_CURATED_EXAMPLES;
  try {
    process.env.AI_CURATED_EXAMPLES = "off";
    assert.equal(publicExampleGuide({ message: "double text", draft: "" }), "");
  } finally {
    if (saved === undefined) delete process.env.AI_CURATED_EXAMPLES;
    else process.env.AI_CURATED_EXAMPLES = saved;
  }
});
