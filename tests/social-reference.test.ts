import test from "node:test";
import assert from "node:assert/strict";
import library from "../data/social-reference.json";
import oldLibrary from "../data/curated-chat.json";
import {
  selectPublicExamples,
  publicExampleGuide,
} from "../lib/ai/curated-examples";

test("reviewed social references retain unique source coordinates and bounded guidance", () => {
  const all = [...oldLibrary.examples, ...library.examples];
  assert.equal(new Set(all.map((e) => e.id)).size, all.length);
  for (const example of library.examples) {
    assert.ok(["soda", "persona-conflicts"].includes(example.source));
    assert.ok(Number.isInteger(example.sourceRow) && example.sourceRow >= 0);
    assert.ok(example.lesson.length < 600 && example.reply.length < 300);
    assert.match(example.sourcePrompt, /adult/i);
    const selected = selectPublicExamples({
      message: example.triggers[0],
      draft: "",
    });
    assert.ok(selected.some((e) => e.lesson === example.lesson));
    assert.ok(
      publicExampleGuide({ message: example.triggers[0], draft: "" }).length <
        2600,
    );
    assert.ok(selected.every((e) => !("sourceId" in e) && !("sourceRow" in e)));
  }
});

test("expanded retrieval does not flood prompts or import unmatched scenarios", () => {
  assert.equal(
    selectPublicExamples({
      message:
        "need someone to talk to, that joke hurt, got a new job, double text",
      draft: "",
    }).length,
    2,
  );
  assert.equal(
    selectPublicExamples({ message: "aaj din bohot kharab tha", draft: "" })
      .length,
    0,
  );
  assert.equal(
    selectPublicExamples({ message: "a crossword puzzle", draft: "" }).length,
    0,
  );
  const boundary = selectPublicExamples({
    message: "that joke hurt",
    draft: "",
  });
  assert.match(boundary[0].lesson, /stop/);
  assert.match(
    selectPublicExamples({ message: "thanks for your help", draft: "" })[0]
      .lesson,
    /no debt/,
  );
});
