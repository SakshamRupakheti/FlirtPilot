# FlirtPilot

**Never wonder what to text again.**

A context-aware AI texting wingman for adults. This first implementation focuses on the landing experience and the Reply workflow (Phases 1 and 2).

## Quick start

1. Install Node.js 22.13 or newer.
2. Run `npm ci`.
3. Copy `.env.example` to `.env.local` and set your OpenAI `AI_API_KEY`.
4. Run `npm run dev` and open http://localhost:5173.

The API key stays on the server. There are no accounts, subscriptions or payments. Without a configured key, requests show a clear setup error rather than simulated AI output.

## What is implemented

- Responsive dark landing page and adult confirmation
- Pasted/manual messages and AI-selected missing-context questions
- Relationship goals, optional gender/context and question skipping
- Nuanced interpretation, evidence and a short strategy
- Exactly three editable Safe / Bold / Risky replies
- Copy, feedback-conditioned regeneration and vibe controls
- Strict OpenAI structured outputs plus Zod validation
- Local-only preferences/anonymous feedback, with a clear-data action
- CI for lint, strict TypeScript, contract tests and production build

## Development

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Built with TypeScript, React, Next.js App Router APIs, Tailwind and shadcn/Radix. Vinext provides the Vite/Cloudflare Worker deployment runtime. GitHub Pages alone cannot execute the server AI endpoint.

See [DEVELOPMENT.md](DEVELOPMENT.md) for architecture, environment settings, privacy decisions, validation limits and the remaining MVP phases. Real OpenAI output and deployment still require server secrets and live validation; the full MVP is not yet complete.
