// A root object is required by OpenAI Structured Outputs; branches live under result.
const string = { type: "string" };
const object = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const array = (items: unknown) => ({ type: "array", items });
const reply = object({ text: string, reason: string });
export const outputFormat = {
  type: "json_schema",
  json_schema: {
    name: "flirtpilot_analysis",
    strict: true,
    schema: object({
      result: {
        anyOf: [
          object({
            status: { type: "string", enum: ["draft_check"] },
            summary: string,
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            risk: { type: "integer", minimum: 0, maximum: 100 },
            bluntness: { type: "integer", minimum: 0, maximum: 100 },
            sexualForwardness: { type: "integer", minimum: 0, maximum: 100 },
            evidence: array(string),
            missingContext: string,
            recommendation: string,
            rewrite: string,
          }),
          object({
            status: { type: "string", enum: ["questions"] },
            contextQuestions: array(
              object({ id: string, question: string, options: array(string) }),
            ),
          }),
          object({
            status: { type: "string", enum: ["complete"] },
            interpretation: object({
              summary: string,
              confidence: { type: "string", enum: ["low", "medium", "high"] },
            }),
            signals: array(object({ label: string, evidence: string })),
            strategy: string,
            replies: object({ safe: reply, bold: reply, risky: reply }),
          }),
          object({
            status: { type: "string", enum: ["boundary"] },
            message: string,
          }),
        ],
      },
    }),
  },
};
