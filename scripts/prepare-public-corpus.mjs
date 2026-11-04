import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Offline by default. Raw and normalized source records stay in ignored work/.
// --download fetches public files only; it never reads keys or private chats.
const root = resolve(import.meta.dirname, "..");
const offsets = [
  0, 100, 1000, 10000, 100000, 200000, 400000, 600000, 800000, 1000000,
];
const sources = [
  ...offsets.map((offset) => ({
    path: `work/soda-rows-${offset}.json`,
    url: `https://datasets-server.huggingface.co/rows?dataset=allenai%2Fsoda&config=default&split=train&offset=${offset}&length=100`,
  })),
  {
    path: "work/soda-README.md",
    url: "https://huggingface.co/datasets/allenai/soda/raw/main/README.md",
  },
  {
    path: "work/persona-conflicts.csv",
    url: "https://raw.githubusercontent.com/mitmedialab/persona-conflicts-corpus-emnlp-2025/main/dataset_final.csv",
  },
  {
    path: "work/persona-profiles.csv",
    url: "https://raw.githubusercontent.com/mitmedialab/persona-conflicts-corpus-emnlp-2025/main/sotopia_agent_profiles.csv",
  },
  {
    path: "work/persona-conflicts-LICENSE.txt",
    url: "https://raw.githubusercontent.com/mitmedialab/persona-conflicts-corpus-emnlp-2025/main/LICENSE",
  },
];
const hash = (value) => createHash("sha256").update(value).digest("hex");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const ledgerPath = resolve(root, "data/public-corpus-audit.json");
const previous = existsSync(ledgerPath)
  ? JSON.parse(readFileSync(ledgerPath, "utf8"))
  : null;
const args = process.argv.slice(2);
if (args.some((arg) => !["--download", "--refresh"].includes(arg)))
  throw new Error("Use --download and/or --refresh only.");
mkdirSync(resolve(root, "work"), { recursive: true });
if (args.includes("--download")) {
  for (const source of sources) {
    if (existsSync(resolve(root, source.path))) continue;
    const response = await fetch(source.url, {
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok)
      throw new Error(`Download failed: ${source.path} (${response.status})`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const pinned = previous?.snapshots.find(
      (entry) => entry.path === source.path,
    );
    if (pinned && pinned.sha256 !== hash(bytes) && !args.includes("--refresh"))
      throw new Error(
        `Source changed: ${source.path}. Review before --refresh.`,
      );
    writeFileSync(resolve(root, source.path), bytes);
  }
}

// RFC-style quoted fields, embedded newlines, escaped quotes and CRLF.
function csv(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === "," || c === "\n")) {
      row.push(cell.replace(/\r$/, ""));
      cell = "";
      if (c === "\n") {
        rows.push(row);
        row = [];
      }
    } else cell += c;
  }
  if (quoted) throw new Error("Unterminated CSV field");
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  const header = rows.shift();
  return rows
    .filter((r) => r.some(Boolean))
    .map((r) => {
      if (r.length !== header.length) throw new Error("CSV column mismatch");
      return Object.fromEntries(
        header.map((key, index) => [key || "rowIndex", r[index]]),
      );
    });
}

const snapshots = sources.map((source) => {
  const bytes = readFileSync(resolve(root, source.path));
  const digest = hash(bytes);
  const pinned = previous?.snapshots.find(
    (entry) => entry.path === source.path,
  );
  if (pinned && pinned.sha256 !== digest && !args.includes("--refresh"))
    throw new Error(`Source changed: ${source.path}. Review before --refresh.`);
  return { ...source, sha256: digest, bytes: bytes.length };
});
const profiles = new Map(
  csv(read("work/persona-profiles.csv")).map((p) => [p.pk, Number(p.age)]),
);
const records = [];
const rejected = [];
for (const offset of offsets) {
  const page = JSON.parse(read(`work/soda-rows-${offset}.json`));
  if (page.rows.length !== 100)
    throw new Error(`Unexpected SODA page size at ${offset}`);
  for (const item of page.rows) {
    const r = item.row;
    if (
      item.truncated_cells.length ||
      !Array.isArray(r.dialogue) ||
      !Array.isArray(r.speakers) ||
      r.dialogue.length !== r.speakers.length
    ) {
      rejected.push({
        source: "soda",
        row: item.row_idx,
        reason: "truncated-or-speaker-turn-mismatch",
      });
      continue;
    }
    records.push({
      source: "soda",
      row: item.row_idx,
      sourceId: r.original_index,
      context: r.narrative,
      ageStatus: "unspecified",
      split: "train",
      turns: r.dialogue.map((text, i) => ({ speaker: r.speakers[i], text })),
      reviewStatus: "quarantined-not-approved",
      license: "CC-BY-4.0",
    });
  }
}
const persona = csv(read("work/persona-conflicts.csv"));
for (const [index, r] of persona.entries()) {
  let turns;
  try {
    turns = JSON.parse(r.transformed_conversation);
  } catch {
    turns = null;
  }
  if (!turns && !r.transformed_conversation.trim()) {
    const blocks = [
      ...r.conversation.matchAll(
        /Turn #(\d+)\s*\n([\s\S]*?)(?=\n\s*Turn #\d+|$)/g,
      ),
    ];
    const parsed = blocks.map((block) => {
      const match = block[2].trim().match(/^([^:\n]+):\s*([\s\S]+)$/);
      return match
        ? {
            turn: Number(block[1]),
            speaker: match[1].trim().replace(/^\(([^()]+)\)$/, "$1"),
            text: match[2].trim(),
          }
        : null;
    });
    if (
      parsed.length &&
      parsed.every(
        (t, i) =>
          t &&
          t.turn === i + 1 &&
          [r.agent_1_name, r.agent_2_name].includes(t.speaker),
      )
    )
      turns = parsed;
  }
  if (
    !Array.isArray(turns) ||
    !turns.length ||
    turns.some(
      (t) => typeof t.text !== "string" || typeof t.speaker !== "string",
    )
  ) {
    rejected.push({
      source: "persona-conflicts",
      row: index,
      reason: "invalid-turns",
    });
    continue;
  }
  const ages = [profiles.get(r.agent_1_id), profiles.get(r.agent_2_id)];
  records.push({
    source: "persona-conflicts",
    row: index,
    sourceId: r.id,
    context: r.original_scenario,
    ageStatus: ages.every((age) => Number.isFinite(age) && age >= 18)
      ? "synthetic-profiles-18-plus"
      : "unspecified-or-under-18",
    split: "unassigned",
    turns: turns.map((t) => ({ speaker: t.speaker, text: t.text })),
    reviewStatus: "quarantined-not-approved",
    license: "MIT",
  });
}
const keys = new Set(records.map((r) => `${r.source}:${r.row}`));
if (keys.size !== records.length)
  throw new Error("Duplicate source coordinates");
const reviewed = JSON.parse(read("data/social-reference.json"));
for (const example of reviewed.examples) {
  const source = records.find(
    (r) => r.source === example.source && r.row === example.sourceRow,
  );
  if (!source || String(source.sourceId) !== String(example.sourceId))
    throw new Error(`Missing provenance: ${example.id}`);
  if (source.turns.some((t) => t.text === example.reply))
    throw new Error(`Unmodified source reply: ${example.id}`);
}
const output =
  records.map((record) => JSON.stringify(record)).join("\n") + "\n";
writeFileSync(resolve(root, "work/public-corpus-quarantine.jsonl"), output);
const report = {
  version: 1,
  reviewedOn: "2026-09-28",
  snapshots,
  counts: {
    sodaDownloaded: offsets.length * 100,
    sodaNormalized: records.filter((r) => r.source === "soda").length,
    personaDownloaded: persona.length,
    personaNormalized: records.filter((r) => r.source === "persona-conflicts")
      .length,
    normalizedTotal: records.length,
    normalizedTurns: records.reduce((n, r) => n + r.turns.length, 0),
    syntheticProfiles18Plus: records.filter(
      (r) => r.ageStatus === "synthetic-profiles-18-plus",
    ).length,
    reviewedAdaptations: reviewed.examples.length,
    rejected: rejected.length,
  },
  rejected,
  normalizedSha256: hash(output),
  normalizedBytes: Buffer.byteLength(output),
  limitations: [
    "Structural validation is not a quality, consent, or safety review.",
    "All normalized raw records remain quarantined, including records with adult synthetic profiles.",
    "SODA sample is deterministic and nonrandom; not the full 1.49M corpus.",
    "Only separately reviewed rewritten adaptations enter runtime prompts. No training was run.",
  ],
};
writeFileSync(ledgerPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report.counts, null, 2));
