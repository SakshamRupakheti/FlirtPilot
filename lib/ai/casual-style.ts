import type { ReplyRequest } from "./schema";

// Reviewed vocabulary only. See data/README.md for provenance and limitations.
export const slangReference = [
  { term: "no cap", meaning: "no lie, for real", sourceRow: 3 },
  {
    term: "hits different",
    meaning: "affects you in a unique way",
    sourceRow: 7,
  },
  { term: "bussin", meaning: "really good, especially food", sourceRow: 8 },
  {
    term: "vibe check",
    meaning: "checking someone's mood or energy",
    sourceRow: 10,
  },
  { term: "slaps", meaning: "really good, especially music", sourceRow: 14 },
  { term: "periodt", meaning: "end of discussion, period", sourceRow: 17 },
] as const;

export function casualStyleGuide(
  input: Pick<ReplyRequest, "message" | "draft">,
) {
  const text = `${input.message} ${input.draft}`.toLowerCase();
  const matches = slangReference.filter(({ term }) =>
    new RegExp(`\\b${term}\\b`, "i").test(text),
  );
  return `Casual conversation guidance: Match the user's actual register, not an imagined Gen-Z persona. Short everyday wording is usually enough. Do not add slang, "bro", or emojis just to sound young. Preserve non-English language and transliteration. Friend-to-friend banter is not evidence of romantic interest or sexual consent. For platonic goals, keep all options platonic; bold/risky can mean candid or funny. Never invent shared plans or fill-in-the-blank locations. A slang word can have other meanings in context ("slaps" may be literal); do not assume its glossary meaning.\n${
    matches.length
      ? `Vocabulary reference from a synthetic CC0 Kaggle dataset, not evidence about these people: ${matches.map(({ term, meaning }) => `${term}: ${meaning}`).join("; ")}. Use only when the conversation supports that meaning.`
      : ""
  }\nFor an unanswered recent message, giving the other person time can be the best strategy. Never assume plans are confirmed: avoid "still on" or "still works" unless they agreed. Never invent having a perfect venue in mind, free time, or being tired. A story view alone does not establish interest or rejection. Generated replies may be optional later messages; do not urge immediate follow-ups just to fill the reply cards.`;
}
