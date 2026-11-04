import test from "node:test";
import assert from "node:assert/strict";
import { casualStyleGuide } from "../lib/ai/casual-style";

test("vocabulary is selected by whole terms without forcing slang into unrelated languages", () => {
  const selected = casualStyleGuide({
    message: "this song SLAPS no cap",
    draft: "",
  });
  assert.match(selected, /slaps: really good/);
  assert.match(selected, /no cap: no lie/);
  assert.doesNotMatch(selected, /bussin:/);
  const unrelated = casualStyleGuide({
    message: "kal kaha gayab thi",
    draft: "bussing",
  });
  assert.doesNotMatch(unrelated, /Vocabulary reference/);
  assert.match(unrelated, /Preserve non-English/);
  assert.match(unrelated, /keep all options platonic/);
  assert.match(
    casualStyleGuide({
      message: "what did you think?",
      draft: "hits different",
    }),
    /hits different: affects/,
  );
});
