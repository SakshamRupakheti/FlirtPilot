"use client";
import { useState } from "react";
import { AppShell } from "./shell";
import { resultSchema, type AnalysisResult } from "@/lib/ai/schema";

export function DraftChecker({ localAI }: { localAI: boolean }) {
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState("");
  const [context, setContext] = useState("");
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const resetResult = () => {
    setResult(null);
    setCopied(false);
    setError("");
  };
  async function check() {
    setBusy(true);
    resetResult();
    try {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          draft,
          context: { relationshipAndGoal: context },
          adultConfirmed: adult,
          action: "check",
        }),
        credentials: "omit",
        redirect: "error",
        signal: AbortSignal.timeout(localAI ? 190000 : 55000),
      });
      const data: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          data &&
            typeof data === "object" &&
            "error" in data &&
            typeof data.error === "string"
            ? data.error
            : "Could not check that reply. Try again.",
        );
      const parsed = resultSchema.safeParse(data);
      if (
        !parsed.success ||
        !["draft_check", "boundary"].includes(parsed.data.status)
      )
        throw new Error("The check didn’t come through correctly. Try again.");
      setResult(parsed.data);
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "TimeoutError"
          ? e.message
          : "That check took too long. Your draft is still here; try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppShell>
      <main className="learning-lab draft-checker">
        <p className="eyebrow">BEFORE YOU HIT SEND</p>
        <h1>Bold move. Or too much?</h1>
        <p>
          Type your draft, then ask your wingman to check the tone. You decide
          what to send.
        </p>
        <div className="learning-grid">
          <section className="workflow-panel">
            <h2>Check my reply</h2>
            <form
              className="learning-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!busy) void check();
              }}
            >
              <fieldset disabled={busy} className="learning-form">
                <label>
                  Their latest message
                  <textarea
                    required
                    maxLength={1800}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      resetResult();
                    }}
                    placeholder="where are you?"
                  />
                </label>
                <label>
                  What you’re thinking of sending
                  <textarea
                    required
                    maxLength={1200}
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      resetResult();
                    }}
                    placeholder="Type your reply here…"
                  />
                </label>
                <label>
                  Relationship, goal and previous tone (optional)
                  <textarea
                    maxLength={1500}
                    value={context}
                    onChange={(e) => {
                      setContext(e.target.value);
                      resetResult();
                    }}
                    placeholder="New match or partner? Already flirting? What do you want from this conversation?"
                  />
                </label>
                <label className="learning-check">
                  <input
                    type="checkbox"
                    required
                    checked={adult}
                    onChange={(e) => setAdult(e.target.checked)}
                  />
                  Everyone involved is 18 or older.
                </label>
                <button className="primary" type="submit">
                  {busy ? "Checking the tone…" : "Check my reply"}
                </button>
                <p className="privacy-note">
                  Nothing is sent while you type. On Check, these fields go to{" "}
                  {localAI
                    ? "Ollama on this computer"
                    : "the configured cloud AI provider"}
                  . Drafts are not saved, used for training, or sent to your
                  contact.
                </p>
              </fieldset>
            </form>
            {error && <p role="alert">{error}</p>}
          </section>
          <section className="workflow-panel" aria-live="polite">
            <h2>Your tone check</h2>
            {busy && (
              <p role="status">
                Reading the message, your draft and the context together…
              </p>
            )}
            {!result && !busy && (
              <p>
                A neutral “where are you?” and an invitation to bed can be very
                different levels of intimacy. Context changes the read.
              </p>
            )}
            {result?.status === "boundary" && <p>{result.message}</p>}
            {result?.status === "draft_check" && (
              <>
                <p>{result.summary}</p>
                <p>
                  <b>Confidence in this read:</b> {result.confidence}
                </p>
                <p className="risk-disclaimer">
                  Rough AI scores out of 100—not probabilities of rejection,
                  attraction or consent. They do not add up to 100.
                </p>
                {(
                  [
                    ["Tone mismatch risk", result.risk],
                    ["Bluntness", result.bluntness],
                    ["Sexual forwardness", result.sexualForwardness],
                  ] as const
                ).map(([label, score]) => (
                  <div className="risk-meter" key={label}>
                    <div>
                      <span>{label}</span>
                      <strong>{Math.round(score / 10) * 10}/100</strong>
                    </div>
                    <meter min={0} max={100} value={score} aria-label={label} />
                  </div>
                ))}
                <h3>Why it might land that way</h3>
                <ul>
                  {result.evidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
                {result.missingContext && (
                  <p>
                    <b>Context that could change this:</b>{" "}
                    {result.missingContext}
                  </p>
                )}
                <p>
                  <b>My suggestion:</b> {result.recommendation}
                </p>
                <div className="learning-entry">
                  <h3>A lower-pressure version</h3>
                  <p>{result.rewrite}</p>
                  <div className="learning-actions">
                    <button
                      className="secondary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(result.rewrite);
                          setCopied(true);
                        } catch {
                          setError(
                            "Could not copy. Select the rewrite and copy it manually.",
                          );
                        }
                      }}
                    >
                      {copied ? "Copied" : "Copy rewrite"}
                    </button>
                    <button
                      className="text-button"
                      onClick={() => {
                        setDraft(result.rewrite);
                        resetResult();
                      }}
                    >
                      Use rewrite and check again
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
