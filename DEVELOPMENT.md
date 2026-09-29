# FlirtPilot development

## Scope and status

September 25 update: the user explicitly brought the iPhone keyboard forward from the future-feature list. `ios/` contains a native companion app/keyboard development preview; Swift compilation and physical iPhone installation are not verified on this Windows machine. It provides local dictionary word suggestions and optional manual AI requests through the new authenticated `/api/keyboard` short-output route. See `ios/README.md` for build/signing constraints, privacy, server setup and pending device QA. The original web Reply path/UI is unchanged; this does not complete the remaining web MVP phases.

This branch implements Phase 1 and Phase 2. Later phases are intentionally not started. The full nine-phase MVP is **not complete**.

Phase 1: original dark wine/pink responsive landing page, interactive examples, six-mode overview, accessible adult gate, metadata and favicon. Reply is enabled. Decode, Revive, Start, Reconnect and Practice are visibly marked as upcoming rather than linking to unfinished pages.

Phase 2 implementation: text/manual chat input; server-selected missing-context questions; relationship goals; optional inclusive gender and custom context; question skipping; structured interpretation, evidence, strategy and exactly three editable replies; clipboard copy; regeneration; feedback-conditioned generation; progressively disclosed vibes; changing loading messages; recoverable error states; browser-only age/vibe preferences and anonymous feedback events. Local Ollama is the default backend; OpenAI is optional.

## Architecture

- TypeScript strict mode, React 19, Next.js App Router APIs, Tailwind 4, shadcn/Radix primitives.
- Vinext supplies the Next-compatible Vite runtime and Cloudflare Worker output. This is a deliberate Sites-hosting compatibility choice, not a standard Next deployment. Preserve the lockfile and build integration.
- `app/page.tsx`: landing. `app/reply/page.tsx`: Reply workspace. `app/api/reply/route.ts`: JSON-only same-origin request boundary, adult confirmation, bounded request body, validation, rate guard, private/no-store responses and sanitized errors.
- `components/flirtpilot`: product components, separate from vendored primitives under `components/ui`.
- `lib/ai`: shared schemas, system prompt, provider abstraction, analysis/generation entrypoints. Only server routes import the provider; clients import schemas/types. Provider secrets never use `NEXT_PUBLIC_` or `VITE_` variables.
- `lib/local-store.ts`: device storage and a bounded event buffer. No chat persistence, product analytics transmission or research dataset ingestion exists in this phase.
- AI provider selects Ollama native `/api/chat` with JSON Schema, or OpenAI Chat Completions with strict JSON Schema. Both independently validate with Zod before returning/rendering. The compact local prompt is separate from the cloud prompt. OpenAI receives `store:false`. Malformed output, local truncation, timeouts and upstream errors do not expose provider responses.

## Run

Use Node 22.13+ (tested locally on Node 24), then `npm ci`. Copy `.env.example` to `.env.local`, start Ollama with the model below, and run `npm run dev` (port 5173). No key is needed for local inference. On Windows with a broken npm PowerShell shim, invoke the installed npm CLI using Node directly.

### Local Windows AI

This checkout uses the official [Ollama portable Windows runtime](https://docs.ollama.com/windows), extracted into ignored `work/ollama/`. Download the `ollama-windows-amd64.zip` asset from [official releases](https://github.com/ollama/ollama/releases) and extract it there on a fresh checkout. Runtime tested: 0.34.2.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local-ai.ps1
./work/ollama/ollama.exe pull qwen3:4b-instruct-2507-q4_K_M
npm run dev
```

The script binds only to 127.0.0.1, disables Ollama cloud, stores model weights under ignored `work/ollama-models`, and limits inference to one request at a time. It starts a hidden background server without changing system environment variables. Re-run after reboot. To free GPU memory: `./work/ollama/ollama.exe stop qwen3:4b-instruct-2507-q4_K_M`. Model automatically unloads after ten idle minutes. No models, runtime binaries, or secrets are committed.

This is inference using an existing model, not training. Qwen 4B Q4 downloads about 2.5GB, plus about 1.5GB for the runtime ZIP. Local hardware: Ryzen 5 7535HS, 8GB RAM, RTX 3050 Laptop 4GB. Close GPU-heavy apps if memory is tight. The local adapter uses an 8192-token context and limits serialized user data to 6000 UTF-8 bytes to leave room for instructions and output. Feedback and prior replies count toward that limit. There are no API fees; hardware, power and any public hosting are separate costs.

Local mode accepts only loopback model servers and never transmits API keys. It does not fall back to OpenAI on failure. A hosted Worker cannot reach this laptop's loopback address: public deployment needs a separately hosted inference service or explicit cloud provider configuration.

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. `npm start` serves the built Worker locally. CI runs all four checks on pushes and pull requests. No API key is required for unit/contract checks or builds.

## Environment

| Variable | Purpose |
|---|---|
| `AI_PROVIDER` | `ollama` for local inference (example default), `openai` for paid cloud. Unset preserves the previous OpenAI configuration. |
| `OLLAMA_BASE_URL` | Local Ollama server, default `http://127.0.0.1:11434`; loopback only. |
| `OLLAMA_MODEL` | Default `qwen3:4b-instruct-2507-q4_K_M`; must be downloaded before use. |
| `AI_API_KEY` | OpenAI project secret; needed only with the OpenAI provider. Set only locally or in the hosting secret manager. |
| `AI_MODEL` | Model ID; example uses `gpt-5-mini`. Must support strict structured outputs. |
| `AI_BASE_URL` | Optional compatible API origin, default `https://api.openai.com/v1`. Only server configuration can set this. HTTPS required in production. |
| `APP_NAME` | Reserved configuration for later rebranding; UI currently uses FlirtPilot. |

Never commit `.env.local`, put a key in a browser form, or print it in logs. `.env.example` contains only empty/example values. A missing key yields an explicit setup error; no fake AI fallback is used.

## Privacy and boundaries

Age gating is self-attestation, not identity verification. Every API request requires adult confirmation. Before calling either provider, a deterministic guard redirects explicit English no-contact phrases and current minor-age statements; tests cover these and a historical-age non-match. This guard was added after a repeated local model test failed to respect no contact. It is conservative and incomplete; ambiguous or multilingual cases still rely on model instructions. A boundary result replaces all reply cards. Broader safety evaluation is required before public launch.

Chats are kept in React memory. Local mode sends requested analysis/regeneration only to Ollama on this computer, with cloud features disabled by the startup script. The app does not log or permanently store chat bodies. Optional OpenAI mode sends them to OpenAI; API abuse-monitoring retention may still apply and `store:false` is not a zero-retention guarantee. Keep OpenAI data-sharing opt-ins disabled. See official [Ollama privacy/local-only settings](https://docs.ollama.com/faq) and [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).

Local event records contain event name, tier, time, anonymous ID and `consent: local_only`; never chat/reply text. Recent feedback text is temporarily sent in the next AI request to improve replies, and is discarded when resetting/closing the conversation. A future consented analytics adapter must be separate from local memory and must not repurpose this buffer automatically.

## Validation and known limitations

- Automated tests cover request/schema bounds, malformed model output, skipped questions, feedback payloads, strict output configuration, missing key, upstream errors, origin checks, oversized payloads and rate-limit reset. Provider responses in tests are explicitly mocked; they do not establish real model quality.
- Production build, TypeScript, lint and eight contract tests pass. Live local tests cover missing-context questions, three-card generation and boundary redirection for explicit no-contact and underage requests. Browser tests exercise the context/goal form, actual reply copying and feedback regeneration producing new cards. Initial cold question request took 27 seconds; warmed complete requests around 20–30 seconds, with CPU/GPU offload. Timing varies with laptop load.
- **Local model quality is a known limitation:** Qwen 4B sometimes overinterprets weak signals, invents details in suggested replies, repeats invitations, or switches Romanized Hindi into English despite instructions. The compact prompt reduces some overconfidence but does not eliminate these errors. Review/edit suggestions before sending. This is not evidence of reliable multilingual quality or comprehensive safety coverage; broader evaluations remain in Phase 7. OpenAI remains unvalidated live because the configured account returned exhausted credits; local mode does not use it.
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

## Vercel mobile preview

### Hosted AI migration (website first)

The latest website direction replaces laptop pairing with a server-side Groq connection. Set `AI_PROVIDER=groq`, secret `GROQ_API_KEY`, and optional `GROQ_MODEL=openai/gpt-oss-20b` in Vercel Production, then redeploy. Do not prefix the key with `NEXT_PUBLIC_`; do not reuse the exposed old OpenAI key. Stay on Groq's Free plan. Requests use strict JSON with Zod validation, a bounded completion budget, and a friendly 429 when the provider allowance is reached. There is no paid-provider fallback.

The Reply page no longer asks end users for a tunnel URL or device code. It remains explicitly unavailable until hosted credentials exist. Privacy copy names the selected provider. Groq receives conversation context when a user requests advice; provider data/abuse-monitoring policies still apply. Do not promise zero retention without checking the account's Data Controls. The dormant relay scripts are retained for history, not started or linked from the current UI. `MODEL_DATA_PLAN.md` describes the future keyboard and consented evaluation approach; no training collection is enabled.

Validation: mocked provider contract tests cover separate credentials, no OpenAI-key fallback, output schema, redirect refusal and free-limit handling. Live Groq quality/latency testing remains pending a user-configured key.

The user selected Vercel for mobile testing. `vercel.json` builds this same app with native Next.js (`npm run build:vercel`); the existing Vinext local workflow remains available. Vercel project `flirt-pilot` tracks `codex/vercel-deployment` for production, since `main` currently contains only the original README. Root Directory is `./`. Do not upload `.env.local` or the keyboard access token.

On Vercel, users can pair their own laptop using the connection panel. Without pairing or explicitly configured server-side cloud inference, generation remains disabled. The hosted keyboard endpoint is disabled. This website does not install the native iPhone keyboard.

### Free laptop connection

`scripts/local-relay.ts` runs a Node bridge bound only to `127.0.0.1:8788`. It deliberately does not read `.env.local` and supports only local Ollama. Requests require a randomly generated 256-bit token from ignored `work/relay-token.txt`. The bridge only exposes authenticated `/health` and `/api/reply`, enforces the production website origin, validates adulthood and input, caps request size, and limits concurrency to one generation. It never exposes raw Ollama endpoints or files. No conversation bodies are logged.

The connection panel accepts only HTTPS `*.trycloudflare.com` origins without credentials, query strings, paths or ports, and refuses redirects. The browser sends advice requests directly to this server bridge; Vercel does not proxy these chats. The token stays in component memory, is cleared on disconnect/refresh, and is never written to analytics, browser storage or GitHub. This is personal testing, not an anonymous public inference service. Anyone with the code can use the bridge; keep it private.

After explicitly approving Cloudflare as the network intermediary, download official `cloudflared-windows-amd64.exe` to ignored `work/cloudflared.exe`, then run `powershell -File scripts/start-phone-ai.ps1`. The script writes pairing details to ignored `work/phone-connection.txt`. Keep the laptop awake. Temporary tunnel addresses change after restart and have no uptime guarantee. Stop the tunnel/bridge with `powershell -File scripts/stop-phone-ai.ps1`; this leaves local Ollama running. Delete `work/relay-token.txt` while the bridge is stopped to rotate the connection code. No payment, router port forwarding, cloud API key or Windows startup service is required.

Status: authenticated bridge tests and production build pass. Starting the public tunnel was blocked by automatic approval review pending explicit consent for conversation text and authorization traffic passing through Cloudflare. Do not represent external phone inference as verified until the tunnel is authorized and tested.
`Groq` is accepted as a server-only alias for `GROQ_API_KEY` to support the existing write-only Vercel secret. The standard name takes precedence.
# Learning Lab (September 27, 2026)

- `/lab` is a device-local example review interface, not a shared admin database. Its page is public, but data is stored only in that browser under `flirtpilot:learning-v1`. No dataset is bundled with the app or committed to Git.
- Supports pasted text, bounded UTF-8 `.txt` imports and local PNG/JPEG/WebP screenshot previews. Screenshot transcription is explicitly manual. Images use temporary object URLs and are not persisted or sent to providers.
- Examples include a corrected preferred reply, reviewer lesson, anonymous grouping, source, timestamp, versioned adult/review attestations and separate export permission. Common identifier masking is a helper, not guaranteed anonymization.
- A session-only, default-off Reply checkbox sends up to two relevant practice examples as untrusted style demonstrations. It uses lexical matching, not fine-tuning. Evaluation examples never enter this selection.
- Each person/conversation group must stay in one split. Evaluation tests send only the held-out conversation to the current reply endpoint, with no library or expected answer. The user judges quality and can download a private report. This is not a benchmark of romantic outcomes.
- JSONL exports include only sharing-approved examples, separately for practice and evaluation, with provenance and consent version. Exports are intermediate reviewed records, not a provider-specific ready-to-run training job. Removing local data or consent prevents future exports but cannot retract already downloaded files.
- Storage writes are bounded (200 examples), validated and report failures. No unreviewed automatic collection, central ingestion, background retraining, model-weight update or paid infrastructure is enabled.
- Pending: automatic image extraction with explicit provider disclosure, authenticated shared ingestion with participant consent records and deletion workflow, dataset deduplication across devices, versioned benchmark automation, and a separately provisioned fine-tuning pipeline. Actual training needs an approved dataset and compute/provider configuration; the free Groq endpoint does not supply training.
# Draft checker (September 27, 2026)

- `/check` provides on-demand draft assessment via the existing server-side `/api/reply` endpoint (`action: check`, bounded `draft`). No typing telemetry or automatic submission. The adult checkbox is required.
- Structured, validated output separates tone mismatch risk, bluntness and sexual forwardness on rough 0–100 ordinal scales. UI rounds to tens and explicitly states these are not probabilities of rejection, attraction or consent. Missing context and confidence are shown alongside evidence and a lower-pressure rewrite.
- Editing inputs clears stale results; users can copy a rewrite or use it as a new draft and recheck. Text is not persisted or automatically shared to the Lab. Provider prompt handles context and boundaries; deterministic checks also inspect the proposed draft.
- This is a mobile web composer, not an overlay on other apps or an installed keyboard. Native integration still requires signed platform apps and a device authentication flow; existing `/api/keyboard` is unchanged.
# Mobile discovery and casual-language reference — September 28, 2026

- The home hero now pairs large icon buttons for Help me reply and Check my reply. Check also has a mode card and remains visible in the mobile header.
- Let’s talk fades/collapses on the Reply route and is removed from keyboard/screen-reader interaction while hidden. Reduced-motion preferences disable transitions.
- Both AI providers receive guidance to preserve conversational register and keep platonic goals platonic. A six-term reviewed CC0 Kaggle glossary is included only for terms present in the submitted message/draft; no extra provider call is required.
- See `data/README.md` for dataset provenance, selected preview rows, and limitations. These are synthetic vocabulary references, not real US chat logs, training examples, or a model-weight update. No private chats are automatically collected.
- Validation: added a vocabulary-selection regression test; the sequential suite passes 21 tests. Mobile layout and deployment verification are recorded in the task handoff.
# Curated synthetic chat guidance — September 28, 2026

- Downloaded the Kaggle author's linked source corpus; validated 3,511 JSONL records against a pinned hash. Added 23 reviewed/adapted situations, not an unfiltered training dump.
- `lib/ai/curated-examples.ts` retrieves at most two matching examples for the shared cloud/local provider. Source system prompts, raw source replies, and evaluation cases are excluded.
- `data/curated-chat.json` records source lines, adaptation status and provenance; third-party MIT notice and review limitations are included in `data/`. Raw download stays ignored.
- `AI_CURATED_EXAMPLES=off` is a server kill switch. No new network dependency, automatic training, or private data collection. Added tokens may modestly affect cost/latency for matching requests.
- `data/chat-evaluation.json` holds seven original adult evaluation cases; `scripts/evaluate-public-chat.ts` runs them against an explicitly supplied app URL without reading private chats. Unit tests cover relevance, matching, bounded selection, provenance, evaluation isolation, kill switch and provider integration. These do not establish a measured gain in social accuracy.
- Initial live review caught premature follow-up advice and an invented coffee venue. Guidance now explicitly distinguishes unanswered invitations from agreed plans and permits waiting instead of immediate follow-ups. The evaluation runner spaces requests by 30 seconds and stops on errors; an optional third argument resumes at a case index after a free-tier reset. Groq free limits and occasional generation failures still apply.
- Follow-up evaluation also exposed invented excuses, speaker confusion and unwanted flirting in a platonic Hindi example. Cloud Groq analysis/generation now uses medium reasoning; draft checks retain low reasoning. Removed irrelevant draft-check instructions from normal generation and placeholder JSON examples from the cloud prompt. The supplied JSON schema still controls output shape. This trades some reasoning tokens/latency for a chance of better contextual judgment; review the evaluation outputs rather than assuming a gain.
- Completed three seven-case development runs, with synthetic outputs and a candid review in `data/evaluations/` and `data/EVALUATION.md`. A larger free-tier 120B trial was reverted: no clear overall benefit over 20B in this small comparison. All 23 regression tests, lint, typecheck and build passed. Semantic failures remain documented; schema validity is not a quality score.
# Public conversation reference expansion — September 28, 2026

Added `data/social-reference.json`: 24 rewritten adult examples from SODA and PersonaConflicts, bringing the conditional reference library to 47. Retrieval remains at most two examples, with no extra API call. See `data/DATASET_CATALOG.md` and third-party notices for source decisions, licenses and exclusions. No fine-tuning or automatic private-chat collection occurred. Live comparison exposed a gratitude-for-repayment regression and conflicting tier definitions; cloud/local prompts now keep tiers aligned with the user's goal, disallow repayment demands, and require supplied availability for specific scheduling suggestions. See `data/EVALUATION.md` for candid results and remaining limitations.

`scripts/prepare-public-corpus.mjs` downloads public snapshots on explicit `--download`, verifies pinned SHA-256 values, normalizes parseable conversations into ignored `work/` with quarantined status, and writes `data/public-corpus-audit.json`. Synthetic age metadata is not quality approval. The strict parser leaves unsupported/malformed rows rejected. No raw corpus is bundled in the app.

`scripts/evaluate-public-chat.ts` accepts an optional fourth argument `social` for the six cases in `data/social-evaluation.json`. These are regression cases rather than independent human evaluation. Current limitations remain grounding, speaker tracking and occasional romantic drift; source volume does not establish a quality improvement.
