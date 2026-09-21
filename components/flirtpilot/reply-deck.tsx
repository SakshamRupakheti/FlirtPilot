"use client";
import { useState } from "react";
import { Copy, Check, RefreshCw, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { CompleteResult, ReplyRequest, Tier } from "@/lib/ai/schema";
import { trackFeedback, setLocal } from "@/lib/local-store";
const tiers: Tier[] = ["safe", "bold", "risky"];
const labels = { safe: "🟢 Safe", bold: "🔥 Bold", risky: "😈 Risky" };
const descriptions = {
  safe: "Easy, natural, no pressure.",
  bold: "A little confidence goes a long way.",
  risky: "For when you’re feeling daring.",
};
const vibes = [
  "Funny",
  "Smooth",
  "Cute",
  "Confident",
  "Teasing",
  "Romantic",
  "Direct",
  "Chill",
  "Dry",
  "Chaotic",
  "Mysterious",
];
export function ReplyDeck({
  result,
  busy,
  vibe,
  onVibe,
  onRegenerate,
}: {
  result: CompleteResult;
  busy: boolean;
  vibe: string;
  onVibe: (v: string) => void;
  onRegenerate: (feedback?: ReplyRequest["feedback"][number]) => void;
}) {
  const [adjust, setAdjust] = useState(false);
  return (
    <>
      <div className="deck-heading">
        <div>
          <p className="eyebrow">YOUR MOVE</p>
          <h2>Three ways to play it.</h2>
        </div>
        <button
          className="text-button"
          onClick={() => setAdjust(!adjust)}
          aria-expanded={adjust}
        >
          <SlidersHorizontal size={16} /> Adjust vibe
        </button>
      </div>
      {adjust && (
        <div className="vibe-panel">
          <p>Same you. Different energy.</p>
          <div className="chips">
            {vibes.map((v) => (
              <button
                disabled={busy}
                key={v}
                className={vibe === v ? "chip selected" : "chip"}
                aria-pressed={vibe === v}
                onClick={() => {
                  onVibe(v);
                  setLocal("vibe", v);
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <p className="privacy-note">
            Choose a vibe, then regenerate to apply it.
          </p>
        </div>
      )}
      <div className="reply-deck">
        {tiers.map((tier) => (
          <ReplyCard
            key={tier + result.replies[tier].text}
            tier={tier}
            reply={result.replies[tier]}
            busy={busy}
            onFeedback={(type) => {
              trackFeedback(type, tier);
              onRegenerate({ type, tier, text: result.replies[tier].text });
            }}
          />
        ))}
      </div>
      <div className="regenerate-row">
        <button
          className="secondary"
          disabled={busy}
          onClick={() => {
            trackFeedback("regenerate");
            onRegenerate();
          }}
        >
          <RefreshCw size={16} /> Regenerate replies
        </button>
        <span className="muted">
          Take what sounds like you. Leave the rest.
        </span>
      </div>
    </>
  );
}
function ReplyCard({
  tier,
  reply,
  busy,
  onFeedback,
}: {
  tier: Tier;
  reply: CompleteResult["replies"][Tier];
  busy: boolean;
  onFeedback: (type: ReplyRequest["feedback"][number]["type"]) => void;
}) {
  const [text, setText] = useState(reply.text);
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      trackFeedback(`copied_${tier}`, tier);
      toast.success("Copied. Go make your move.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(
        "Couldn’t copy automatically. Select the reply and copy it manually.",
      );
    }
  }
  return (
    <article className={`reply-card ${tier}`}>
      <div className="reply-card-title">
        <h3>{labels[tier]}</h3>
        <button
          aria-label={`Copy ${tier} reply`}
          className="copy-button"
          onClick={copy}
          disabled={!text.trim()}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="reply-description">{descriptions[tier]}</p>
      <textarea
        aria-label={`Edit ${tier} reply`}
        value={text}
        maxLength={1200}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text !== reply.text) trackFeedback("user_edited_reply", tier);
        }}
        rows={3}
      />
      <p className="reply-reason">{reply.reason}</p>
      <div className="feedback">
        <button disabled={busy} onClick={() => onFeedback("more_like_this")}>
          More like this
        </button>
        <button disabled={busy} onClick={() => onFeedback("too_cringe")}>
          Too cringe
        </button>
        <button disabled={busy} onClick={() => onFeedback("too_much")}>
          Too much
        </button>
        <button disabled={busy} onClick={() => onFeedback("too_boring")}>
          Too boring
        </button>
      </div>
    </article>
  );
}
