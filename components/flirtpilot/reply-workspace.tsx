"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AppShell } from "./shell";
import { AgeGate } from "./age-gate";
import { ContextQuestionnaire } from "./context-questionnaire";
import { ReplyDeck } from "./reply-deck";
import {
  resultSchema,
  type AnalysisResult,
  type Question,
  type ReplyRequest,
} from "@/lib/ai/schema";
import { getLocal } from "@/lib/local-store";
import { readExamples, selectExamples, learningKey } from "@/lib/learning";
import { LearningEditor } from "./learning-editor";
const goals = [
  "Just flirting",
  "Get their number/social",
  "Go on a date",
  "Casual dating",
  "Hookup",
  "Friends with benefits",
  "See where it goes",
  "Long-term relationship",
  "Reconnect with ex",
  "Become friends first",
  "Not sure",
];
const initialQuestions: Question[] = [];
const statuses = [
  "Reading the room…",
  "Checking the vibe…",
  "Trying not to fumble this…",
  "Cooking replies…",
  "Measuring the risk…",
];
export function ReplyWorkspace({
  localAI = false,
  previewOnly = false,
  providerName = "OpenAI",
}: {
  localAI?: boolean;
  previewOnly?: boolean;
  providerName?: "Groq" | "OpenAI";
}) {
  const unavailable = previewOnly;
  const [useExamples, setUseExamples] = useState(false);
  const [ready, setReady] = useState(false),
    [adult, setAdult] = useState(false),
    [message, setMessage] = useState(""),
    [step, setStep] = useState<"message" | "context" | "result">("message");
  const [context, setContext] = useState<Record<string, string>>({}),
    [questions, setQuestions] = useState<Question[]>(initialQuestions),
    [result, setResult] = useState<AnalysisResult | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [vibe, setVibe] = useState("Natural"),
    [status, setStatus] = useState(0);
  const feedback = useRef<ReplyRequest["feedback"]>([]),
    abort = useRef<AbortController | null>(null),
    resultRef = useRef<HTMLDivElement>(null),
    pending = useRef(false);
  // Hydrate device-only preferences after SSR; this one-time update is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setAdult(getLocal<boolean>("adult", false) === true);
    const saved = getLocal<string>("vibe", "Natural");
    setVibe(typeof saved === "string" ? saved : "Natural");
    setReady(true);
    return () => abort.current?.abort();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(
      () => setStatus((s) => (s + 1) % statuses.length),
      2200,
    );
    return () => clearInterval(id);
  }, [busy]);
  const update = (key: string, value: string) =>
    setContext((c) => ({ ...c, [key]: value }));
  async function request(
    skip = false,
    regenerate = false,
    event?: ReplyRequest["feedback"][number],
  ) {
    if (unavailable || !adult || !message.trim() || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setStatus(0);
    if (event) feedback.current = [...feedback.current, event].slice(-8);
    const controller = new AbortController();
    abort.current = controller;
    const timeout = setTimeout(
      () => controller.abort(),
      localAI ? 190000 : 55000,
    );
    try {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({
          message,
          context,
          adultConfirmed: adult,
          skipQuestions: skip,
          action: regenerate || skip ? "generate" : "analyze",
          vibe,
          feedback: feedback.current,
          learningExamples: useExamples
            ? selectExamples(readExamples(), message)
            : [],
          previousReplies:
            regenerate && result?.status === "complete"
              ? Object.values(result.replies).map((r) => r.text)
              : [],
        }),
        signal: controller.signal,
      });
      const json: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          json &&
            typeof json === "object" &&
            "error" in json &&
            typeof json.error === "string"
            ? json.error
            : "My wingman brain froze for a second. Try again.",
        );
      const parsed = resultSchema.safeParse(json);
      if (!parsed.success)
        throw new Error(
          "That reply didn’t come through quite right. Try again.",
        );
      if (parsed.data.status === "questions") {
        setQuestions(parsed.data.contextQuestions);
        setStep("context");
      } else {
        setResult(parsed.data);
        setStep("result");
        setTimeout(
          () =>
            resultRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            }),
          80,
        );
      }
    } catch (e) {
      setError(
        controller.signal.aborted
          ? "That took a little too long. Your message is still here—try again."
          : e instanceof Error
            ? e.message
            : "My wingman brain froze for a second. Try again.",
      );
    } finally {
      clearTimeout(timeout);
      pending.current = false;
      setBusy(false);
    }
  }
  function reset() {
    setMessage("");
    setContext({});
    setQuestions(initialQuestions);
    setResult(null);
    setStep("message");
    setError("");
    feedback.current = [];
  }
  return (
    <AppShell>
      <Toaster theme="dark" />
      <AgeGate
        localAI={localAI}
        previewOnly={previewOnly}
        providerName={providerName}
        open={ready && !adult}
        onConfirm={() => setAdult(true)}
      />
      <main className="workspace">
        <Link className="back-link" href="/">
          <ArrowLeft size={14} /> Back to your wingman
        </Link>
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">THE REPLY ROOM</p>
            <h1>
              Let’s find <span>your words.</span>
            </h1>
            <p className="muted">
              A good reply starts with understanding the conversation.
            </p>
          </div>
          <span className="workspace-icon">
            <MessageCircle size={29} />
          </span>
        </div>
        {previewOnly && (
          <p
            role="status"
            className="mb-6 rounded-2xl border border-pink-400/30 bg-pink-500/10 p-5 text-sm text-pink-100"
          >
            Your wingman is getting connected. Hosted AI setup is not finished
            yet. You won’t need a laptop or a connection code to use it.
          </p>
        )}
        <div className="progress-steps" aria-label="Reply progress">
          {["The message", "The context", "Your next move"].map((label, i) => (
            <span
              key={label}
              className={
                i === (step === "message" ? 0 : step === "context" ? 1 : 2)
                  ? "active"
                  : ""
              }
            >
              <b>{i + 1}</b>
              {label}
            </span>
          ))}
        </div>
        <div className="workspace-layout">
          <fieldset className="workflow-panel" aria-busy={busy} disabled={busy}>
            <legend className="sr-only">Your conversation</legend>
            {step === "message" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (message.trim()) void request(false);
                }}
              >
                <div className="panel-heading">
                  <span className="mini-mark">✳</span>
                  <div>
                    <h2>What did they say?</h2>
                    <p>
                      One message or the whole exchange. Give me something to
                      work with.
                    </p>
                  </div>
                </div>
                <label className="field-label" htmlFor="message">
                  Their message or your conversation
                </label>
                <textarea
                  id="message"
                  className="conversation-text"
                  placeholder={
                    "Them: haha maybe 😭\n\nYou can include your last message, too."
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={12000}
                  required
                  rows={7}
                />
                <div className="input-meta">
                  <span>
                    For a full chat, label messages “Me:” and “Them:”.
                  </span>
                  <span>{message.length.toLocaleString()} / 12,000</span>
                </div>
                <button
                  className="text-button example-button"
                  type="button"
                  onClick={() =>
                    setMessage(
                      "Me: coffee with me this weekend?\nThem: haha maybe 😭",
                    )
                  }
                >
                  Try an example <ArrowRight size={14} />
                </button>
                <div className="form-bottom">
                  <p className="privacy-note">
                    <ShieldCheck size={14} /> No chats saved. No account needed.
                  </p>
                  <button
                    className="primary"
                    disabled={unavailable || !adult || !message.trim() || busy}
                    type="submit"
                  >
                    Read the room <ArrowRight size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={unavailable || busy || !adult || !message.trim()}
                  className="skip-button"
                  onClick={() => void request(true)}
                >
                  Skip questions → just give me replies
                </button>
              </form>
            )}
            {step === "context" && (
              <>
                <div className="panel-heading">
                  <span className="mini-mark">✳</span>
                  <div>
                    <h2>Before I cook…</h2>
                    <p>
                      Give me a little context. Better context, better replies.
                    </p>
                  </div>
                </div>
                <blockquote className="message-preview">{message}</blockquote>
                <ContextQuestionnaire
                  questions={questions}
                  context={context}
                  onChange={update}
                />
                <div className="goal-field">
                  <label className="field-label" id="goal-label">
                    What do YOU want from this?
                  </label>
                  <Select
                    value={context.goal || ""}
                    onValueChange={(v) => update("goal", v)}
                  >
                    <SelectTrigger
                      aria-labelledby="goal-label"
                      className="w-full h-12"
                    >
                      <SelectValue placeholder="Choose your goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {goals.map((g) => (
                        <SelectItem value={g} key={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <details className="extra-context">
                  <summary>
                    Anything else I should know? <span>Optional</span>
                  </summary>
                  <label className="field-label" htmlFor="details">
                    Timing, how you met, boundaries, your usual texting style…
                  </label>
                  <textarea
                    id="details"
                    rows={3}
                    maxLength={2000}
                    value={context.details || ""}
                    onChange={(e) => update("details", e.target.value)}
                    placeholder="We met last week. They usually reply the same day…"
                  />
                  <div className="gender-fields">
                    {["Your gender", "Their gender"].map((label, i) => (
                      <div key={label}>
                        <label className="field-label" id={`gender-${i}`}>
                          {label}
                        </label>
                        <Select
                          value={context[label] || ""}
                          onValueChange={(v) => update(label, v)}
                        >
                          <SelectTrigger
                            aria-labelledby={`gender-${i}`}
                            className="w-full"
                          >
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "Man",
                              "Woman",
                              "Nonbinary",
                              "Prefer not to say",
                              "Custom",
                            ].map((v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {context[label] === "Custom" && (
                          <input
                            aria-label={`Custom ${label.toLowerCase()}`}
                            maxLength={100}
                            value={context[`${label} custom`] || ""}
                            onChange={(e) =>
                              update(`${label} custom`, e.target.value)
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </details>
                <div className="context-actions">
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => {
                      setStep("message");
                      setError("");
                    }}
                  >
                    <ArrowLeft size={14} /> Edit message
                  </button>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() => void request(true)}
                  >
                    <Sparkles size={16} /> Find my replies
                  </button>
                </div>
                <button
                  disabled={busy}
                  className="skip-button"
                  onClick={() => void request(true)}
                >
                  Skip questions → just give me replies
                </button>
              </>
            )}
            {step === "result" && result && (
              <div ref={resultRef} className="result-content">
                {result.status === "complete" ? (
                  <>
                    <div className="panel-heading">
                      <span className="mini-mark">✳</span>
                      <div>
                        <h2>What I think is happening</h2>
                        <p className="confidence">
                          {result.interpretation.confidence} confidence · a
                          read, not a fact
                        </p>
                      </div>
                    </div>
                    <p className="interpretation">
                      {result.interpretation.summary}
                    </p>
                    <div className="signals">
                      <h3>The signals</h3>
                      {result.signals.map((s, i) => (
                        <div key={i} className="signal">
                          <span>
                            <Check size={13} />
                            {s.label}
                          </span>
                          <p>{s.evidence}</p>
                        </div>
                      ))}
                    </div>
                    <div className="strategy">
                      <span>THE MOVE</span>
                      <p>{result.strategy}</p>
                    </div>
                  </>
                ) : result.status === "boundary" ? (
                  <div className="boundary">
                    <ShieldCheck size={28} />
                    <h2>Let’s respect that boundary.</h2>
                    <p>{result.message}</p>
                  </div>
                ) : null}
                <button
                  disabled={busy}
                  className="text-button"
                  onClick={() => {
                    setStep("context");
                    setError("");
                  }}
                >
                  <ArrowLeft size={14} /> Update the context
                </button>
              </div>
            )}
            {error && (
              <div role="alert" className="error-box">
                {error}
                <button onClick={() => setError("")} aria-label="Dismiss error">
                  <X size={16} />
                </button>
              </div>
            )}
            {busy && (
              <div className="loading-analysis" role="status">
                <span className="loading-spark">✳</span>
                <strong>{statuses[status]}</strong>
                <span>Putting the whole picture together.</span>
              </div>
            )}
          </fieldset>
          <aside className="context-aside">
            <span className="aside-mark">“</span>
            <h3>
              Sound like you.
              <br />
              Just a little smoother.
            </h3>
            <p>
              We look at the context, the energy, and what you want. Then help
              you find words you’d actually send.
            </p>
            <div className="aside-divider" />
            <div className="risk-key">
              <span>🟢</span>
              <div>
                <strong>Safe</strong>
                <p>Keep it comfortable.</p>
              </div>
            </div>
            <div className="risk-key">
              <span>🔥</span>
              <div>
                <strong>Bold</strong>
                <p>Make your interest clear.</p>
              </div>
            </div>
            <div className="risk-key">
              <span>😈</span>
              <div>
                <strong>Risky</strong>
                <p>Turn up the confidence.</p>
              </div>
            </div>
            <p className="privacy-note">Daring never means disrespectful.</p>
          </aside>
        </div>
        {result?.status === "complete" && step === "result" && (
          <ReplyDeck
            result={result}
            busy={busy}
            vibe={vibe}
            onVibe={setVibe}
            onRegenerate={(event) => void request(true, true, event)}
          />
        )}
        <section className="learning-reply-options">
          <label className="learning-check">
            <input
              type="checkbox"
              checked={useExamples}
              onChange={(e) => setUseExamples(e.target.checked)}
            />
            Use my reviewed practice examples for this session
          </label>
          <p className="privacy-note">
            When enabled, up to two relevant examples from this device are sent
            to the AI provider with your next request. Evaluation examples are
            excluded. <Link href="/lab">Open Learning Lab</Link>
          </p>
          {result?.status === "complete" && step === "result" && (
            <details>
              <summary>Teach my wingman — review an example</summary>
              <p>
                Rewrite a reply in your own words and explain what would be
                better. Nothing is saved until you approve it.
              </p>
              <LearningEditor
                key={message}
                initial={message.slice(0, 1800)}
                source="reply"
              />
            </details>
          )}
        </section>
        <div className="workspace-bottom">
          <button disabled={busy} className="text-button" onClick={reset}>
            Start a fresh conversation
          </button>
          <details>
            <summary>Privacy, in plain words</summary>
            <p>
              {previewOnly
                ? "This preview does not send your text to an AI service. Text you enter stays in this page until you leave or reset it. "
                : localAI
                  ? "Messages and context are processed by Ollama on this computer. No cloud AI provider receives them. Chats are not automatically saved or used for training. "
                  : `Messages and context go to ${providerName} only when you request advice. Chats are not automatically saved or used for training. The provider’s retention and abuse-monitoring policies apply. `}
              Learning Lab saves only examples you explicitly approve on this
              device. Optional example guidance sends selected practice examples
              with your request. Dataset exports are separate and never
              automatic. Age confirmation, vibe preferences and feedback counts
              stay in this browser. Feedback contains no message text and is
              never uploaded.
            </p>
            <button
              className="text-button"
              onClick={() => {
                ["adult", "vibe", "feedback", "anonymousId"].forEach((k) => {
                  try {
                    localStorage.removeItem(`flirtpilot:${k}`);
                  } catch {}
                });
                try {
                  localStorage.removeItem(learningKey);
                } catch {}
                setUseExamples(false);
                setAdult(false);
                setVibe("Natural");
                reset();
                toast.success(
                  "Local preferences, feedback and learning examples cleared.",
                );
              }}
            >
              Clear my local data
            </button>
          </details>
        </div>
      </main>
    </AppShell>
  );
}
