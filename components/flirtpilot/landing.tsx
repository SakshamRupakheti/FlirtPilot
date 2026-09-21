"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  MessageCircle,
  ScanText,
  RotateCcw,
  Sparkles,
  HeartHandshake,
  MessagesSquare,
  LockKeyhole,
  Check,
} from "lucide-react";
import { AppShell } from "./shell";
const examples = [
  {
    message: "haha maybe 😭",
    read: "Could be playful. Could be unsure. What you said before matters more than the emoji.",
    reply: "okay, what would make it a yes?",
  },
  {
    message: "you’re trouble",
    read: "This could be an invitation to banter, especially if they’re matching your energy.",
    reply: "only a little. you’ll survive",
  },
  {
    message: "we should do that sometime",
    read: "There may be interest here. A specific, low-pressure plan is a good way to find out.",
    reply: "let’s make sometime saturday?",
  },
];
export function Landing() {
  const [example, setExample] = useState(0);
  const e = examples[example];
  return (
    <AppShell>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> YOUR NEXT TEXT, FIGURED OUT
            </div>
            <h1>
              Never wonder
              <br />
              what to <span>text again.</span>
            </h1>
            <p className="hero-description">
              Drop the message. Give me the context.
              <br />
              I’ll tell you what it might mean and what to say next.
            </p>
            <div className="hero-actions">
              <Link className="primary" href="/reply">
                Help me reply <ArrowRight size={18} />
              </Link>
              <a className="secondary" href="#modes">
                Decode a message <ScanText size={18} />
              </a>
            </div>
            <div className="trust">
              <span>
                <Check size={14} /> No signup. Just vibes.
              </span>
              <span>
                <LockKeyhole size={14} /> Your chats stay yours.
              </span>
            </div>
          </div>
          <div className="hero-demo">
            <div className="demo-top">
              <span>
                <span className="pink">✳</span> A LITTLE LESS “WHAT DO I SAY?”
              </span>
              <span className="demo-label">INTERACTIVE EXAMPLE</span>
            </div>
            <div className="chat-label">THEM</div>
            <button
              className="message-bubble"
              onClick={() => setExample((example + 1) % examples.length)}
              aria-label="Try the next example message"
            >
              {e.message}
              <span>↻</span>
            </button>
            <div className="demo-analysis">
              <span className="mini-mark">✳</span>
              <div>
                <strong>Okay, here’s the read.</strong>
                <p>{e.read}</p>
              </div>
            </div>
            <div className="demo-reply">
              <span className="safe-dot" /> SAFE{" "}
              <span className="demo-reply-line">{e.reply}</span>
              <ArrowRight size={16} />
            </div>
            <div className="demo-bottom">
              <span>Context first. Confidence next.</span>
              <button
                onClick={() => setExample((example + 1) % examples.length)}
              >
                Try another ↻
              </button>
            </div>
          </div>
        </section>
        <section id="modes" className="modes-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PICK YOUR SITUATION</p>
              <h2>What do you need help with?</h2>
            </div>
            <span>No perfect words required.</span>
          </div>
          <div className="mode-grid">
            <Link href="/reply" className="mode-card featured">
              <MessageCircle />
              <span className="mode-badge">START HERE</span>
              <h3>Reply</h3>
              <p>I don’t know what to say back.</p>
              <ArrowRight className="mode-arrow" />
            </Link>
            {[
              {
                name: "Decode",
                copy: "What does this message mean?",
                Icon: ScanText,
              },
              {
                name: "Revive",
                copy: "This conversation died.",
                Icon: RotateCcw,
              },
              {
                name: "Start",
                copy: "Help me make the first move.",
                Icon: Sparkles,
              },
              {
                name: "Reconnect",
                copy: "I want to text someone again.",
                Icon: HeartHandshake,
              },
            ].map(({ name, copy, Icon }) => (
              <div className="mode-card upcoming" key={name}>
                <Icon />
                <span className="mode-badge">COMING NEXT</span>
                <h3>{name}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>
          <div className="practice-preview">
            <MessagesSquare size={20} />
            <span>Want a little practice first?</span>
            <span className="muted">
              Practice conversations are coming in a later release.
            </span>
          </div>
        </section>
        <section id="how-it-works" className="how">
          <div>
            <p className="eyebrow">LESS GUESSING. MORE UNDERSTANDING.</p>
            <h2>
              Good replies start
              <br />
              with the <span className="pink">whole picture.</span>
            </h2>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "Drop the message",
                "The awkward, the ambiguous, the ‘what does that even mean?’",
              ],
              [
                "02",
                "Give us the context",
                "Who they are. What happened. What you actually want.",
              ],
              [
                "03",
                "Make your next move",
                "Understand the signals. Pick safe, bold, or a little daring.",
              ],
            ].map(([n, t, d]) => (
              <div key={n}>
                <span>{n}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
