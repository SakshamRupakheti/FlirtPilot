# FlirtPilot: agent handoff

September 25 update: the user requested iPhone 14 keyboard work despite having no Mac. See `ios/README.md` and the `feat/iphone-keyboard` branch for native source, optional authenticated short AI requests and pending macOS/device verification. The original September 21 inventory below describes the web baseline. Existing web UI is preserved. Do not treat the iOS source as an installed app or assume phone access to the laptop's localhost.

Prepared September 21, 2026. Read this and DEVELOPMENT.md before making changes. This document contains no secrets.

## Repository and checkout

- Private repository: https://github.com/SakshamRupakheti/FlirtPilot
- Working branch: `feat/phase-1-2`. The app is on this branch, not yet merged into `main`.
- Existing draft PR: https://github.com/SakshamRupakheti/FlirtPilot/pull/1
- Last implementation commit at handoff: `b9fc65156bbdc77af3c1caf6eb4dcd25b0fd0bb4` (Worker redirect compatibility fix). This handoff adds a subsequent documentation commit.
- Local workspace: `C:\Users\saksh\Documents\Codex\2026-09-21\you-are-the-lead-full-stack`
- OS/shell: Windows / PowerShell. Local app: http://localhost:5173 ; Reply: http://localhost:5173/reply
- Ollama API: http://127.0.0.1:11434 . These URLs refer to the user's computer, not a public deployment.
- Working tree was clean before creating this handoff. Run `git status` again before starting; the user or another agent may have made changes.
- Another agent needs access to the private repository. Never send it the user's GitHub credentials.

Fresh checkout:

```sh
git clone --branch feat/phase-1-2 https://github.com/SakshamRupakheti/FlirtPilot.git
cd FlirtPilot
npm ci
```

On this Windows workspace, Git may report an ownership mismatch. Use a per-command exception for this exact trusted directory, not a global wildcard:

```powershell
git -c safe.directory=C:/Users/saksh/Documents/Codex/2026-09-21/you-are-the-lead-full-stack status
```

Prior commits used `Codex <codex@openai.com>` via per-command Git settings. No global identity changes are necessary. Continue the existing PR for this work; coordinate before concurrent agents edit the same files. Use a separate branch/worktree when work overlaps.

## User preferences and product contract

The user likes the existing UI, UX and modal. Preserve the dark wine/pink identity and current layout unless specifically asked to redesign. They want useful working software, real AI, code saved to GitHub, and minimal unnecessary confirmation questions. They requested a free local alternative to paid API calls. Do not silently switch back to a paid provider.

FlirtPilot is an adult 18+ AI texting wingman, not a dating marketplace. Main promise: "Never wonder what to text again." Conversation understanding is the focus, not generic pickup lines. Understand relationship, preceding conversation, user intent and uncertainty. Support all genders/orientations without stereotypes. Present exactly three primary replies: Safe, Bold, Risky; risky means socially daring, never coercive. Honor clear no-contact boundaries and exclude flirting involving minors. Do not claim certainty about another person's feelings.

No user accounts, subscriptions, payment pages or public chat datasets. Keep chat data out of analytics/training. Future opt-in memory, analytics and research datasets must remain separate.

## Implemented versus pending

Phase 1 UI and Phase 2 Reply functionality are implemented: landing, interactive example, six-mode overview, adult gate, text input, context/goal form, model-selected questions, skip questions, interpretation/signals/strategy, three editable replies, copy, regenerate, feedback and progressive vibe controls. Local preferences and anonymous feedback persist in the browser. Models are real; there is no fake AI fallback.

The full MVP is NOT complete. Only `/`, `/reply`, and `/api/reply` are active product routes. Other mode cards are marked upcoming. No screenshot understanding, saved-person memory, conversation history, dedicated decoder or practice mode exists yet.

Priority before expanding: improve local output quality and context-question reliability. A late live request with only "haha maybe" returned replies instead of asking questions. Small-model instruction following is inconsistent; do not assume unit tests establish model quality. Keep existing UI while improving this behavior.

Then continue the original phase order:

3. Decode: literal meaning, emotional tone, plausible alternatives, context evidence, rough interpretation weights clearly labeled non-scientific.
4. Screenshot upload/paste/drop, multimodal extraction, participant/message order, editable confirmation before advice. Current Qwen text model does not provide this feature; choose a vision-capable approach explicitly.
5. Revive, Start and Reconnect with mode-specific context.
6. Opt-in local person profiles, conversation summaries, reusable context and deletion.
7. Multilingual/style fidelity evaluations, including Romanized Hindi/Nepali.
8. Secondary practice chat with coaching.
9. Responsive/accessibility QA and polish.

Do not introduce future accounts, payments, contact integrations, model training or mobile apps while these remain incomplete.

## Stack and important files

Strict TypeScript, React 19, Next 16 App Router APIs, Tailwind 4, shadcn/Radix and Zod. **Actual runtime is Vinext/Vite with Cloudflare Worker output**, not stock `next dev`. Preserve runtime integration and lockfile. Node >=22.13; local development has used Node 24.

| Path relative to repo                                               | Responsibility                                                                            |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `README.md`                                                         | Quick start and feature summary                                                           |
| `DEVELOPMENT.md`                                                    | Architecture, environment, decisions, limitations, future phases                          |
| `app/page.tsx`                                                      | Landing route                                                                             |
| `app/reply/page.tsx`                                                | Server entry; passes local-provider flag to UI                                            |
| `app/api/reply/route.ts`                                            | Same-origin JSON endpoint; adult validation, 40 KB body cap, rate limit, sanitized errors |
| `app/layout.tsx`                                                    | Root document, metadata, fonts/layout                                                     |
| `app/globals.css`                                                   | Design system and product styling                                                         |
| `app/error.tsx`                                                     | Recoverable error boundary                                                                |
| `components/flirtpilot/landing.tsx`                                 | Hero, interactive example and mode overview                                               |
| `components/flirtpilot/shell.tsx`                                   | Navigation and footer                                                                     |
| `components/flirtpilot/age-gate.tsx`                                | Adult confirmation modal and provider-aware privacy copy                                  |
| `components/flirtpilot/reply-workspace.tsx`                         | Message/context/result state, request lifecycle, goals, feedback, privacy and reset       |
| `components/flirtpilot/context-questionnaire.tsx`                   | Model-selected question controls                                                          |
| `components/flirtpilot/reply-deck.tsx`                              | Editable reply cards, clipboard, feedback buttons, vibes                                  |
| `components/ui/`                                                    | Reusable starter UI primitives; many unused by current product                            |
| `lib/ai/schema.ts`                                                  | Zod input and result contracts/types                                                      |
| `lib/ai/structured-output.ts`                                       | JSON Schema sent to providers                                                             |
| `lib/ai/provider.ts`                                                | Server-only usage: provider selection, fetch, output validation and error mapping         |
| `lib/ai/prompt.ts`                                                  | Cloud model system prompt                                                                 |
| `lib/ai/local-prompt.ts`                                            | Compact local-model system prompt                                                         |
| `lib/ai/boundaries.ts`                                              | Deterministic explicit English no-contact/current-minor statements, before either model   |
| `lib/ai/analyzeConversation.ts`                                     | Analysis entrypoint                                                                       |
| `lib/ai/generateReplies.ts`                                         | Generation entrypoint, skip further questions                                             |
| `lib/ai/rate-limit.ts`                                              | Bounded in-memory per-isolate request guard; not distributed                              |
| `lib/local-store.ts`                                                | Local preferences, anonymous ID and up to 200 feedback events without message text        |
| `tests/ai.test.ts`                                                  | Eight tests covering contracts, provider options, failures, guards and requests           |
| `scripts/start-local-ai.ps1`                                        | Portable Ollama background startup; local-only, cloud disabled                            |
| `scripts/run-framework.mjs`                                         | Framework dev/build entrypoint                                                            |
| `scripts/execution-profile.mjs`                                     | Local versus managed runtime selection                                                    |
| `scripts/sites-env.*`, `scripts/build-verified.sh`, install scripts | Starter hosting/install integration                                                       |
| `vite.config.ts`, `next.config.ts`, `build/`                        | Framework and Sites build configuration                                                   |
| `.github/workflows/ci.yml`                                          | npm ci, lint, typecheck, tests and build on Node 22                                       |
| `.env.example`                                                      | Safe configuration template, local Ollama by default                                      |
| `.gitignore`                                                        | Excludes real environment, runtime/model downloads and generated files                    |
| `.openai/hosting.json`                                              | Existing Sites registration; no verified deployment; don't duplicate registration         |
| `db/`, `drizzle/`, `drizzle.config.ts`, `examples/d1/`              | Starter database scaffolding, not implemented relationship memory                         |
| `app/chatgpt-auth.ts`                                               | Starter auth helper; no product login flow is implemented or requested                    |
| `public/`, `vendor/`, `hooks/`, `lib/utils.ts`                      | Assets, vendored CSS/licenses and shared helpers                                          |

## Request flow and contracts

Browser -> POST `/api/reply` -> Zod request validation -> analyze/generate service -> explicit boundary guard -> selected provider -> Zod result validation -> UI. No browser AI keys.

Request fields: `message`, `context` record, `adultConfirmed:true`, `action:analyze|generate`, `skipQuestions`, `vibe`, up to eight recent feedback objects and up to three previous replies. Message max12,000 characters; context max16 entries of2,000 characters each. Ollama applies an additional6,000 UTF-8 byte limit to the entire serialized user payload, including feedback.

Result is one of `questions` (1–3 questions; UI also asks goal), `complete` (interpretation, signals, strategy, safe/bold/risky replies), or `boundary` (short redirect, no cards). Provider JSON wraps this in `{ "result": ... }`; HTTP endpoint returns the validated inner result.

## Local AI and environment

Existing `.env.local` is in the workspace root and is ignored by Git. **Do not print, upload, commit or copy it into the handoff.** It may contain an old OpenAI secret. A key was previously pasted into chat; never reuse/reproduce that exposed value. Local inference does not need any API key.

Safe active settings:

```dotenv
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b-instruct-2507-q4_K_M
```

Optional cloud variables: `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL`. OpenAI is used only if explicitly selected or legacy configuration leaves AI_PROVIDER unset. Local examples explicitly select Ollama. The prior OpenAI account returned exhausted credits. No cloud fallback exists. `APP_NAME` is reserved; branding is currently hardcoded.

Local runtime installed from official Ollama release0.34.2 into `work/ollama/`. Model weights reside in `work/ollama-models/`. Both are ignored and not available in a Git clone. Another computer must install Ollama and download the model. Runtime ZIP about1.5GB, model about2.5GB, extracted files need additional disk space.

Laptop: Ryzen5 7535HS, 8GB RAM, NVIDIA RTX3050 Laptop 4GB. Model uses CPU/GPU offload; warmed requests have taken20–30 seconds. Other apps and cold loading affect timing. Native `/api/chat`, structured format, 8192 context,1600 output tokens, one parallel request,180-second server timeout,190-second browser timeout. Model unloads after10 idle minutes; this is normal, and next request loads it again.

The startup script sets loopback host, project-local model path, `OLLAMA_NO_CLOUD=1`, one parallel request, flash attention and quantized KV cache. No automatic startup at login was installed. A sleeping/off laptop cannot serve inference. A public cloud site cannot use this computer's localhost automatically; public hosting remains a separate decision.

Start on this machine, from repo root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local-ai.ps1
node scripts/run-framework.mjs dev
```

Do not launch duplicate dev servers if port5173 already serves this app. On a fresh setup download the model after starting Ollama:

```powershell
./work/ollama/ollama.exe pull qwen3:4b-instruct-2507-q4_K_M
```

For an ordinary Ollama installation use `ollama pull ...` and `ollama serve` as needed. Follow official installation instructions for that OS; the portable script is Windows-specific.

## Validation and debugging

Standard commands: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

Windows npm shim has sometimes resolved the wrong path. Working alternatives:

```powershell
& 'C:/Program Files/nodejs/node.exe' 'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js' ci
node node_modules/eslint/bin/eslint.js . --ignore-pattern dist --ignore-pattern .next
node node_modules/typescript/bin/tsc --noEmit
node node_modules/tsx/dist/cli.mjs --test tests/ai.test.ts
node scripts/run-framework.mjs build
```

Tests use mocked upstream responses; live endpoint/browser testing is also necessary. Earlier implementation passed local build/lint/typecheck and GitHub CI. Latest connection fix passed eight tests and two live endpoint calls, including all three reply tiers. Check GitHub Actions for the current commit rather than assuming old validation covers new edits.

Critical fixed bug: `fetch(..., {redirect:"error"})` is incompatible with the Worker runtime and immediately produced the misleading "local wingman couldn't connect" message even though Ollama was healthy. Commit b9fc651 uses `redirect:"manual"` and rejects non-2xx, retaining no-redirect behavior. Do not change it back. Tests assert manual redirect mode and 302 rejection.

Diagnose locally without printing secrets or private chats:

```powershell
Invoke-RestMethod http://127.0.0.1:11434/api/version
Invoke-RestMethod http://127.0.0.1:11434/api/tags
Invoke-RestMethod http://127.0.0.1:11434/api/ps
```

`api/tags` lists downloaded models; `api/ps` lists loaded models. An empty `ps` alone is not a missing-model failure. Runtime logs are ignored `work/ollama.stdout.log` and `work/ollama.stderr.log`. Use synthetic conversations for debugging. Do not expose raw model/provider error details to users. Restart the dev process when environment changes don't take effect.

## Known limitations and next agent's first task

1. Local model quality is inconsistent: wrong speaker inference, invented details, repeated invitations, overconfidence, ignored missing-context questions and English replies to Romanized Hindi. Feedback wiring works but quality improvements aren't guaranteed. Build representative live evaluations before claiming these solved.
2. Model-only no-contact handling failed a repeat test. The deterministic English guard now handles clear cases, but is not a complete multilingual safety classifier. It can be conservative; improve with meaningful tests rather than treating keyword rules as universal understanding.
3. No reliable success/romantic-outcome metrics exist. Copy and rejection events are preferences only. Chats are not saved across refresh; only age/vibe/anonymous feedback persist.
4. No public deployment, full multilingual QA or full mobile-width/accessibility sweep is complete. Avoid claiming production readiness.
5. The app is text-only today. Do not claim the downloaded model can analyze screenshots.

Suggested first assignment: preserve the UI, verify current local startup and real Reply workflow, then improve context-question and speaker/language fidelity with measurable evaluations. Coordinate scope with the user before moving into the next product phase. Maintain DEVELOPMENT.md and update the existing PR with validation and honest limitations.

## Complete tracked file inventory

The following inventory is generated from Git for this handoff. Relative paths are rooted at the checkout above. Ignored secrets, models, binaries, node_modules and generated output are deliberately excluded.

Use this command to print the exact complete tracked inventory at any time:

```powershell
git ls-files
```

The important tracked groups are:

- `app/`: routes, layout, API endpoint, error boundary and starter ChatGPT auth helper.
- `components/flirtpilot/`: product shell, landing, age gate, reply workspace, context form and reply deck.
- `components/ui/`: generated shadcn/Radix primitives.
- `lib/ai/`: request/result schemas, prompts, local/cloud providers, deterministic boundaries, rate guard and workflow services.
- `lib/local-store.ts`: browser-only preferences and feedback events.
- `tests/ai.test.ts`: provider, route, schema and boundary contract tests.
- `scripts/`: Vinext/Sites build helpers, CI install helpers and local Ollama startup.
- `public/`, `vendor/`, `hooks/`, `lib/utils.ts`: assets and shared starter utilities.
- `db/`, `drizzle/`, `examples/d1/`: starter database scaffolding, not active product memory.
- Root configuration: `package.json`, lockfile, `tsconfig.json`, `vite.config.ts`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json`, `drizzle.config.ts`, `cloudflare-env.d.ts`, `.env.example`, `.gitignore`.
- Docs and operations: `README.md`, `DEVELOPMENT.md`, this `HANDOFF.md`, `.github/workflows/ci.yml`, `.openai/hosting.json`.

Never include `.env.local`, `work/`, `.wrangler/`, `dist/`, `.next/`, `node_modules/`, or generated output when sending repository information to another agent. `.env.local` may contain an old exposed OpenAI key; revoke/replace it rather than sharing it.
