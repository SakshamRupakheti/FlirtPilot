# FlirtPilot

**Never wonder what to text again.**

## Current website and source

The live Vercel website is built from [`codex/vercel-deployment`](https://github.com/SakshamRupakheti/FlirtPilot/tree/codex/vercel-deployment). The original `main` branch is not the deployed app.

- [Reply](https://flirt-pilot-lake.vercel.app/reply): contextual replies using hosted Groq.
- [Check my reply](https://flirt-pilot-lake.vercel.app/check): on-demand draft tone assessment and rewrite. Scores are rough judgments, not outcome probabilities.
- [Learning Lab](https://flirt-pilot-lake.vercel.app/lab): reviewed device-local examples, opt-in guidance, evaluation and consent-based export. No automatic model training.

Code map: `app/` contains pages and server endpoints, `components/flirtpilot/` contains product UI, `lib/ai/` contains AI schemas/prompts/providers, `lib/learning.ts` handles reviewed examples, and `tests/` contains regression tests. See `DEVELOPMENT.md` for current deployment details. `ios/` is native source, not an installed keyboard.

For hosted Groq use server-only `AI_PROVIDER=groq`, `GROQ_API_KEY` and optionally `GROQ_MODEL=openai/gpt-oss-120b`. The existing Vercel secret named `Groq` is supported as an alias. Never commit keys or personal chats. The local Ollama alternative is documented below.

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

The optional [iPhone keyboard development preview](ios/README.md) adds local word suggestions and a shorter authenticated AI endpoint. It is native source, not yet a signed/installable iPhone app. Building it requires macOS/Xcode or a configured macOS build service; the Windows web workflow below remains unchanged.

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Built with TypeScript, React, Next.js App Router APIs, Tailwind and shadcn/Radix. Vinext provides the Vite/Cloudflare Worker deployment runtime. GitHub Pages alone cannot execute the server AI endpoint.

See [DEVELOPMENT.md](DEVELOPMENT.md) for architecture, environment settings, privacy decisions, validation limits and the remaining MVP phases. Local mode is for this computer; a publicly hosted site cannot automatically use your laptop's model. The full MVP is not yet complete.
