# FlirtPilot

**Never wonder what to text again.**

A context-aware AI texting wingman for adults. This first implementation focuses on the landing experience and the Reply workflow (Phases 1 and 2).

## Quick start

1. Install Node.js 22.13 or newer.
2. Run `npm ci`.
3. Install [Ollama](https://ollama.com/download), then run `ollama pull qwen3:4b-instruct-2507-q4_K_M`. For the portable Windows setup used here, see [DEVELOPMENT.md](DEVELOPMENT.md).
4. Copy `.env.example` to `.env.local`. The default selects local Ollama; no API key is required.
5. Keep Ollama running, run `npm run dev` and open http://localhost:5173.

Local mode runs a downloaded model on your computer with no per-request API fees. It needs available RAM/GPU resources and electricity. There is no automatic cloud fallback. OpenAI remains optional by explicitly setting `AI_PROVIDER=openai` and configuring server-only credentials. There are no accounts, subscriptions or payments.

## What is implemented

- Responsive dark landing page and adult confirmation
- Pasted/manual messages and AI-selected missing-context questions
- Relationship goals, optional gender/context and question skipping
- Nuanced interpretation, evidence and a short strategy
- Exactly three editable Safe / Bold / Risky replies
- Copy, feedback-conditioned regeneration and vibe controls
- Ollama JSON Schema output or optional OpenAI structured output, plus Zod validation
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

See [DEVELOPMENT.md](DEVELOPMENT.md) for architecture, environment settings, privacy decisions, validation limits and the remaining MVP phases. Local mode is for this computer; a publicly hosted site cannot automatically use your laptop's model. The full MVP is not yet complete.
