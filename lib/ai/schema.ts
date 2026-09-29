import { z } from "zod";
import { exampleHintSchema } from "../learning";
const text = z.string().trim().min(1).max(2400);
export const questionSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,60}$/),
  question: text,
  options: z.array(z.string().max(100)).max(12),
});
export const requestSchema = z.object({
  message: z.string().trim().min(1).max(12000),
  context: z
    .record(z.string().max(2000))
    .refine((v) => Object.keys(v).length <= 16),
  adultConfirmed: z.literal(true),
  skipQuestions: z.boolean().default(false),
  action: z.enum(["analyze", "generate", "check"]).default("analyze"),
  draft: z.string().trim().max(1200).default(""),
  vibe: z.string().max(40).default("Natural"),
  feedback: z
    .array(
      z.object({
        type: z.enum([
          "more_like_this",
          "too_cringe",
          "too_much",
          "too_boring",
        ]),
        tier: z.enum(["safe", "bold", "risky"]),
        text: z.string().max(1200),
      }),
    )
    .max(8)
    .default([]),
  previousReplies: z.array(z.string().max(1200)).max(3).default([]),
  learningExamples: z.array(exampleHintSchema).max(2).default([]),
});
const reply = z.object({
  text: z.string().trim().min(1).max(1200),
  reason: text,
});
export const resultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("questions"),
    contextQuestions: z.array(questionSchema).min(1).max(3),
  }),
  z.object({
    status: z.literal("complete"),
    interpretation: z.object({
      summary: text,
      confidence: z.enum(["low", "medium", "high"]),
    }),
    signals: z
      .array(z.object({ label: z.string().max(80), evidence: text }))
      .max(5),
    strategy: text,
    replies: z.object({ safe: reply, bold: reply, risky: reply }),
  }),
  z.object({ status: z.literal("boundary"), message: text }),
  z.object({
    status: z.literal("draft_check"),
    summary: text,
    confidence: z.enum(["low", "medium", "high"]),
    risk: z.number().int().min(0).max(100),
    bluntness: z.number().int().min(0).max(100),
    sexualForwardness: z.number().int().min(0).max(100),
    evidence: z.array(text).min(1).max(4),
    missingContext: z.string().max(600),
    recommendation: text,
    rewrite: z.string().trim().min(1).max(1200),
  }),
]);
export type ReplyRequest = z.infer<typeof requestSchema>;
export type AnalysisResult = z.infer<typeof resultSchema>;
export type CompleteResult = Extract<AnalysisResult, { status: "complete" }>;
export type Question = z.infer<typeof questionSchema>;
export type Tier = "safe" | "bold" | "risky";
