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
