# FlirtPilot development

## Scope and status

This branch implements Phase 1 and Phase 2. Later phases are intentionally not started. The full nine-phase MVP is **not complete**.

Phase 1: original dark wine/pink responsive landing page, interactive examples, six-mode overview, accessible adult gate, metadata and favicon. Reply is enabled. Decode, Revive, Start, Reconnect and Practice are visibly marked as upcoming rather than linking to unfinished pages.

Phase 2 implementation: text/manual chat input; server-selected missing-context questions; relationship goals; optional inclusive gender and custom context; question skipping; structured interpretation, evidence, strategy and exactly three editable replies; clipboard copy; regeneration; feedback-conditioned generation; progressively disclosed vibes; changing loading messages; recoverable error states; browser-only age/vibe preferences and anonymous feedback events. A local OpenAI key is configured, but live validation is blocked by exhausted API credits.

## Architecture

- TypeScript strict mode, React 19, Next.js App Router APIs, Tailwind 4, shadcn/Radix primitives.
- Vinext supplies the Next-compatible Vite runtime and Cloudflare Worker output. This is a deliberate Sites-hosting compatibility choice, not a standard Next deployment. Preserve the lockfile and build integration.
- `app/page.tsx`: landing. `app/reply/page.tsx`: Reply workspace. `app/api/reply/route.ts`: JSON-only same-origin request boundary, adult confirmation, bounded request body, validation, rate guard, private/no-store responses and sanitized errors.
- `components/flirtpilot`: product components, separate from vendored primitives under `components/ui`.
- `lib/ai`: shared schemas, system prompt, provider abstraction, analysis/generation entrypoints. Only server routes import the provider; clients import schemas/types. Provider secrets never use `NEXT_PUBLIC_` or `VITE_` variables.
- `lib/local-store.ts`: device storage and a bounded event buffer. No chat persistence, product analytics transmission or research dataset ingestion exists in this phase.
- AI provider uses Chat Completions with strict JSON Schema and independently validates the result with Zod before returning/rendering it. OpenAI receives `store:false`. Model refusals, truncation, malformed output, timeouts and upstream errors do not expose provider responses.

## Run

Use Node 22.13+ (tested locally on Node 24), then `npm ci`. Copy `.env.example` to `.env.local`, set server secrets, and run `npm run dev` (port 5173). On Windows with a broken npm PowerShell shim, invoke the installed npm CLI using Node directly.

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. `npm start` serves the built Worker locally. CI runs all four checks on pushes and pull requests. No API key is required for unit/contract checks or builds.

## Environment

| Variable | Purpose |
|---|---|
| `AI_API_KEY` | OpenAI project secret; required for real analysis. Set only locally or in the hosting secret manager. |
| `AI_MODEL` | Model ID; example uses `gpt-5-mini`. Must support strict structured outputs. |
| `AI_BASE_URL` | Optional compatible API origin, default `https://api.openai.com/v1`. Only server configuration can set this. HTTPS required in production. |
| `APP_NAME` | Reserved configuration for later rebranding; UI currently uses FlirtPilot. |

Never commit `.env.local`, put a key in a browser form, or print it in logs. `.env.example` contains only empty/example values. A missing key yields an explicit setup error; no fake AI fallback is used.

## Privacy and boundaries

Age gating is self-attestation, not identity verification. Every API request requires adult confirmation; the prompt also checks for underage participants and prohibited conduct. A boundary result replaces all reply cards. Model-based detection needs ongoing evaluation and is not infallible.

Chats are kept in React memory and sent to OpenAI only on user-requested analysis/regeneration. The app does not log or permanently store chat bodies. OpenAI API abuse-monitoring retention may still apply; `store:false` is not a zero-retention guarantee. Keep OpenAI data-sharing opt-ins disabled. See the official [data controls](https://developers.openai.com/api/docs/guides/your-data) and [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) documentation.

Local event records contain event name, tier, time, anonymous ID and `consent: local_only`; never chat/reply text. Recent feedback text is temporarily sent in the next AI request to improve replies, and is discarded when resetting/closing the conversation. A future consented analytics adapter must be separate from local memory and must not repurpose this buffer automatically.

## Validation and known limitations

- Automated tests cover request/schema bounds, malformed model output, skipped questions, feedback payloads, strict output configuration, missing key, upstream errors, origin checks, oversized payloads and rate-limit reset. Provider responses in tests are explicitly mocked; they do not establish real model quality.
- Production build and TypeScript/lint are checked locally; browser QA covers landing, editable input, context controls and setup-error preservation. A real OpenAI request returned HTTP 429, `insufficient_quota` / `credit_balance_exhausted`. The app presents a recoverable service-funding message. Real generation, multilingual output quality, boundary adherence and copy/regeneration with live OpenAI remain pending until API credits are available.
- Rate limiting is per Worker isolate, not a global quota. Add shared edge rate limiting and provider project spending limits before a public launch. The no-account design remains intact.
- Site registration exists in `.openai/hosting.json`; do not create a duplicate Site. The hosting workflow is available again. No live deployment has been verified. GitHub Pages cannot host these server AI routes. Local secrets are not automatically copied to production.

## Next phases (in order)

3. Dedicated Decoder with rough interpretation weights and contextual evidence.
4. Multimodal screenshots, editable extraction and confirmation; no permanent image retention.
5. Revive, Start and Reconnect workflows.
6. Opt-in person memory, histories/summaries and deletion using local storage/IndexedDB.
7. Evaluate multilingual/transliterated style fidelity (prompt groundwork exists).
8. Practice conversations and coaching.
9. Extended responsive/accessibility QA, motion and error polish.

No accounts, pricing, subscriptions, social integrations or training pipeline are included.
