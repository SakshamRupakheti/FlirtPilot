import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

// Usage: node scripts/audit-chat-source.mjs work/genz-source.jsonl
// Read-only audit. Never downloads, imports source instructions, or uploads chats.
const file = process.argv[2];
if (!file) throw new Error("Pass the downloaded source JSONL path.");
const bytes = readFileSync(file);
const library = JSON.parse(
  readFileSync(new URL("../data/curated-chat.json", import.meta.url)),
);
assert.equal(
  createHash("sha256").update(bytes).digest("hex"),
  library.sha256,
  "Source changed; review a new version before importing.",
);
const rows = bytes.toString("utf8").trim().split(/\r?\n/).map(JSON.parse);
for (const [index, row] of rows.entries()) {
  assert.deepEqual(
    row.messages.map((m) => m.role),
    ["system", "user", "assistant"],
    `Invalid roles at line ${index + 1}`,
  );
  assert.ok(
    row.messages.every(
      (m) => typeof m.content === "string" && m.content.trim(),
    ),
    `Empty content at line ${index + 1}`,
  );
}
for (const example of library.examples) {
  const source = rows[example.sourceLine - 1];
  assert.equal(
    source.messages[1].content,
    example.sourcePrompt,
    `Source mismatch for ${example.id}`,
  );
  assert.notEqual(
    source.messages[2].content,
    example.reply,
    "Raw persona output must not enter the curated examples.",
  );
}
console.log(
  JSON.stringify(
    {
      recordsValidated: rows.length,
      selectedSituations: library.examples.length,
      rawAssistantRepliesImported: 0,
      rawSystemPromptsImported: 0,
      sha256: library.sha256,
    },
    null,
    2,
  ),
);
