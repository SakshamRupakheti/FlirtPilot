import type { ReplyRequest, AnalysisResult } from "./schema";

// Defense in depth for explicit statements; model instructions handle ambiguous
// and multilingual cases. This is intentionally not a complete safety classifier.
export function explicitBoundary(input: ReplyRequest): AnalysisResult | null {
  const text = [input.message, ...Object.values(input.context)].join("\n");
  const noContact =
    /\b(?:never|do not|don't|don’t|stop)\s+(?:ever\s+)?(?:contact(?:ing)?|text(?:ing)?|messag(?:e|ing)|call(?:ing)?)\s+(?:me|them|him|her)\b|\b(?:asked|told|said|requested)\b[^.!?\n]{0,60}\bno[ -]contact\b|\bblocked\s+me\b[^.!?\n]{0,120}\b(?:another|new|different)\s+account\b/i;
  if (noContact.test(text))
    return {
      status: "boundary",
      message:
        "They’ve asked for no contact. Give them that space instead of sending another message or using a different account.",
    };
  const minor =
    /\b(?:i am|i'm|i’m|he is|he's|he’s|she is|she's|she’s|they are|they're|they’re|we are both)\s+(?:only\s+)?(?:1[0-7]|[6-9])\b|\b(?:1[0-7]|[6-9])[ -]year[ -]old\b/i;
  if (minor.test(text))
    return {
      status: "boundary",
      message:
        "FlirtPilot is for conversations between adults 18 and over. I can’t help with romantic or sexual messages involving someone under 18.",
    };
  return null;
}
