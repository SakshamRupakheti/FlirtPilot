import { z } from "zod";

export const exampleHintSchema = z.object({
  conversation: z.string().trim().min(1).max(1800),
  preferredReply: z.string().trim().min(1).max(600),
  lesson: z.string().trim().min(1).max(600),
});
export const learningExampleSchema = exampleHintSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  source: z.enum(["typed", "file", "screenshot", "reply"]),
  group: z.string().trim().min(1).max(80),
  split: z.enum(["practice", "evaluation"]),
  consent: z.object({
    version: z.literal(1),
    adults: z.literal(true),
    reviewed: z.literal(true),
    share: z.boolean(),
  }),
});
export type LearningExample = z.infer<typeof learningExampleSchema>;
export const learningKey = "flirtpilot:learning-v1";

export function readExamples(): LearningExample[] {
  const raw = localStorage.getItem(learningKey);
  if (!raw) return [];
  return z.array(learningExampleSchema).max(200).parse(JSON.parse(raw));
}
export function saveExamples(examples: LearningExample[]) {
  const valid = z.array(learningExampleSchema).max(200).parse(examples);
  const splits = new Map<string, string>();
  for (const example of valid) {
    const group = example.group.toLocaleLowerCase();
    if (splits.has(group) && splits.get(group) !== example.split)
      throw new Error(
        "Keep the same person/conversation group in one set to avoid leaking evaluation examples into practice.",
      );
    splits.set(group, example.split);
  }
  localStorage.setItem(learningKey, JSON.stringify(valid));
}
export function redactCommonIdentifiers(text: string) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/https?:\/\/\S+/g, "[link]")
    .replace(/@[\w.]+/g, "[handle]")
    .replace(/\+?\d[\d ()-]{7,}\d/g, "[phone]");
}
export function selectExamples(examples: LearningExample[], message: string) {
  const tokens = new Set(
    message.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || [],
  );
  return examples
    .filter((e) => e.split === "practice")
    .map((e) => ({
      e,
      score: (
        e.conversation.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || []
      ).filter((t) => tokens.has(t)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ e }) => exampleHintSchema.parse(e));
}
export function exportDataset(
  examples: LearningExample[],
  split: LearningExample["split"],
) {
  return examples
    .filter((e) => e.consent.share && e.split === split)
    .map((e) =>
      JSON.stringify({
        schemaVersion: 1,
        id: e.id,
        group: e.group,
        split: e.split,
        source: e.source,
        consent: e.consent,
        reviewedAt: e.createdAt,
        messages: [
          { role: "user", content: e.conversation },
          { role: "assistant", content: e.preferredReply },
        ],
        reviewerLesson: e.lesson,
      }),
    )
    .join("\n");
}
