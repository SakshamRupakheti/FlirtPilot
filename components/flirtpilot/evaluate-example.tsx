"use client";
import { useState } from "react";
import { resultSchema, type AnalysisResult } from "@/lib/ai/schema";
import type { LearningExample } from "@/lib/learning";

export function EvaluateExample({ example }: { example: LearningExample }) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [rating, setRating] = useState("");
  const [revision, setRevision] = useState("unknown");
  async function evaluate() {
    setBusy(true);
    setError("");
    setResult(null);
    setRating("");
    try {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: example.conversation,
          context: {},
          adultConfirmed: true,
          skipQuestions: true,
          action: "generate",
          learningExamples: [],
        }),
        signal: AbortSignal.timeout(55000),
        credentials: "omit",
        redirect: "error",
      });
      const json: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          json &&
            typeof json === "object" &&
            "error" in json &&
            typeof json.error === "string"
            ? json.error
            : "Could not run this evaluation. Try again.",
        );
      setRevision(response.headers.get("X-FlirtPilot-Revision") || "unknown");
      setResult(resultSchema.parse(json));
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "ZodError"
          ? e.message
          : "The evaluation response was invalid. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="learning-evaluation">
      <summary>Test the current model on this example</summary>
      <p>
        Running this test sends the reviewed conversation to the configured AI
        provider. The preferred reply, lesson and example library are withheld.
        Free-tier usage limits apply.
      </p>
      <button
        disabled={busy}
        className="secondary"
        onClick={() => void evaluate()}
      >
        {busy ? "Checking the current model…" : "Run evaluation"}
      </button>
      {error && <p role="alert">{error}</p>}
      {result?.status === "complete" && (
        <div>
          <p>{result.interpretation.summary}</p>
          {Object.entries(result.replies).map(([tier, reply]) => (
            <p key={tier}>
              <b>{tier}:</b> {reply.text}
            </p>
          ))}
        </div>
      )}
      {result?.status === "boundary" && <p>{result.message}</p>}
      {result && (
        <>
          <label>
            Does it meet your example’s lesson?
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value="">Choose a judgment</option>
              <option value="pass">Pass</option>
              <option value="mixed">Needs improvement</option>
              <option value="fail">Fail</option>
            </select>
          </label>
          <button
            className="text-button"
            disabled={!rating}
            onClick={() => {
              const report = {
                version: 1,
                exampleId: example.id,
                testedAt: new Date().toISOString(),
                configuration: "current website provider and prompt",
                revision,
                rating,
                expectedLesson: example.lesson,
                preferredReply: example.preferredReply,
                result,
              };
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(report, null, 2)], {
                  type: "application/json",
                }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = `flirtpilot-evaluation-${example.id}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            Download private evaluation report
          </button>
          <p className="privacy-note">
            This report stays on your device unless you share it. It measures
            response quality, not romantic success. Nothing is automatically
            retrained.
          </p>
        </>
      )}
    </details>
  );
}
