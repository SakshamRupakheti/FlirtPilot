# FlirtPilot for iPhone — private offline pilot

**Current branch: `codex/keyboard-offline-pilot`. Do not deploy this branch.** The current native target is an offline pilot: dictionary word suggestions, a few next-word continuations, optional spacing/apostrophe cleanup, guarded insertion, Undo, and an in-app pilot checklist. It does not contain an LLM, call a network service, require Full Access, request App Groups/Keychain entitlements, or depend on laptop Ollama. `KeyboardAPI.swift` and `Shared/Settings.swift` remain archived source and are excluded from both pilot targets. `RequestsOpenAccess` is false.

See [PILOT.md](PILOT.md) for current build/install/testing instructions and limitations. The notes below describe the earlier network-enabled development preview, **not the current pilot target**. No signed IPA, simulator verification or iPhone installation has been completed yet.

## Archived network-enabled preview notes

This is native iOS source for an iOS 16+ companion app and custom keyboard, including iPhone 14. It is **not yet a signed/installable app**. Development was performed on Windows; Swift compilation, simulator layout and device testing are pending. The existing web UI is preserved.

## What is implemented in source

- QWERTY keyboard, shift, symbols, backspace, space, return and system keyboard switch control.
- Local Apple `UITextChecker` word completion/spelling suggestions, refreshed after a 120ms typing pause. These are dictionary suggestions, not a trained flirting model or full grammar engine. The first layout/dictionary is English; users can switch keyboards for other scripts.
- A keyboard-specific adult confirmation. Reset via `Reset 18+`.
- Optional explicit Rewrite/Reply actions with Chill/Funny/Direct tone. No network requests on ordinary keystrokes.
- Three short AI suggestions, tap to replace the exact visible draft excerpt used for generation. Editing/moving the cursor cancels and invalidates pending results. Never auto-send.
- Companion setup app with instructions, a practice field, HTTPS endpoint settings and device-token storage in shared Keychain (not AI API keys).
- Ephemeral networking, redirect refusal, no persistent chat storage, clipboard monitoring or analytics.

The extension cannot read the conversation above an app's input field. For Reply, the user deliberately puts the other person's message into the draft field, taps Reply, then selects a suggestion to replace that excerpt. iOS can expose only part of a long input field, so the keyboard explicitly refers to the **visible draft excerpt**. Use short drafts; do not assume it can rewrite an entire hidden document. Secure fields and apps that disable third-party keyboards use Apple's keyboard.

## Building without your own Mac

Xcode requires macOS. Windows can edit the source and test the server, but cannot build/sign the iOS target. A manually dispatched GitHub Actions workflow (`.github/workflows/ios-build.yml`) can compile an **unsigned simulator build** on a macOS runner. It is manual to avoid starting potentially billable macOS jobs automatically. Check your repository's included Actions allowance/spending settings before running it. The workflow does not create an installable iPhone IPA or upload anything to TestFlight. It may need to be present on the default branch before GitHub displays the manual Run workflow control.

To install on a physical iPhone, a Mac or remote macOS signing/build environment and your Apple signing/provisioning setup are still required. TestFlight distribution requires the applicable Apple Developer setup. No paid service, enrollment, signing identity or public inference server has been created. Do not share Apple credentials in chat.

## Xcode project generation

The checked-in `project.yml` is the XcodeGen source of truth. Generated project files and plists are ignored.

On a macOS build host with Xcode and XcodeGen installed:

```sh
cd ios
xcodegen generate
xcodebuild -project FlirtPilot.xcodeproj -scheme FlirtPilot \
  -sdk iphonesimulator -configuration Debug \
  -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

For a device build, open the generated project in Xcode, select your team, and register unique application/extension IDs. Change the bundle prefix, app group `group.com.flirtpilot.shared`, and shared Keychain suffix consistently in `project.yml` and `Shared/Settings.swift` if required by your team. The extension ID must remain prefixed by the containing app's bundle ID. Both targets need the same App Group and Keychain Sharing access. Signing failure must not be bypassed by removing secure credential storage.

After installing: Settings → General → Keyboard → Keyboards → Add New Keyboard → FlirtPilot. Use the globe button to switch. Offline word completion needs no network access. Enable Allow Full Access only for optional AI; the companion app explains exactly which text is sent and when.

## AI server setup

The optional API is `POST /api/keyboard`, backed by local Ollama on the **server machine**. It does not run a large language model inside the iPhone keyboard. Your existing laptop can run this server, but `localhost` on an iPhone points to the phone, not the laptop. No tunnel, LAN exposure or public deployment is configured by this change. A trusted reachable HTTPS deployment with its own inference connectivity is necessary for phone AI; decide that separately.

Server environment:

```dotenv
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b-instruct-2507-q4_K_M
KEYBOARD_ACCESS_TOKEN=<at least 32 random characters, distinct from any AI provider key>
```

The endpoint is disabled when the device token is absent/short. A trusted operator provisions the same device token into the companion app's SecureField. Never commit it. This MVP uses one revocable server credential for a private device setup, not production multi-user authentication. Rotate the server token to revoke access, then reconnect authorized devices. Do not distribute this token with an App Store build. A future public product requires per-device credentials and distributed abuse controls.

Requests use `Authorization: Bearer <device-token>` and JSON:

```json
{"mode":"rewrite","draft":"want to grab coffee?","theirMessage":"","vibe":"Chill","adultConfirmed":true}
```

Reply mode uses `theirMessage`. Each field is capped at 500 characters and the serialized model input at 2200 UTF-8 bytes. Response is either `{"status":"suggestions","suggestions":["...","...","..."]}` in Safe/Bold/Risky order, or `{"status":"boundary","message":"..."}`. Failure responses contain only a friendly `error` string.

The short path uses a 4096-token context and 240-token output cap instead of full analysis's 8192/1600. It retains schema validation and existing explicit boundary checks. It doesn't generate lengthy explanations. It uses the same model as full analysis; switching context sizes may reload its allocation, so don't assume alternating paths stays warm. No speed guarantee or "fastest" claim is made. Local word completion and AI generation are distinct latency measures.

## Validation

Run all TypeScript tests, lint, typecheck and build from the repository root. Benchmark real local inference with synthetic text:

```sh
node --env-file=.env.local --import tsx scripts/benchmark-keyboard.ts
```

It makes two full-analysis calls and two short-suggestion calls, prints only timings/statuses and refuses to run with a paid provider. First calls may include model loading; the second samples are warm. This is a small diagnostic, not a statistically robust latency benchmark. Track correctness and boundary/language fidelity alongside speed.

An initial very fast sample was invalidated after the model returned tone labels rather than sendable messages. Validation now rejects bare tone labels, and the prompt gives a concrete output example. Do not use the earlier 1.35s sample as evidence of useful reply speed. See the final measurements below; tasks differ (rewriting three lines versus full analysis), and this is not an iPhone/network benchmark or a model-quality guarantee.

Final live Worker HTTP checks on September 25: a coffee invitation rewrite returned three sendable messages in 2.41s, and a different "had fun talking" rewrite returned three messages in 2.02s. The earlier full-analysis samples on the same laptop took 28.65s first / 15.56s warm. These two successful HTTP samples include local server overhead but no phone-network latency. They show the benefit of a smaller task, not general model correctness, consistent sub-three-second performance or superiority to other products. Unauthenticated access returned HTTP 401.

Before device release, verify on iPhone 14: unsigned compilation, signed install, App Group/Keychain access, offline/full-access-off behavior, fast typing/cursor edits while requests are pending, emoji deletion, safe insertion, long/truncated text context, portrait/landscape layout, VoiceOver, globe long-press, token revocation, slow/unreachable servers and secure fields. Current minimal keyboard does not implement dictation, slide typing, long-press accented keys, backspace repeat or Apple's predictive language model. Full grammar correction and broad multilingual keyboard layouts remain future work.

## Sources

- [Apple custom keyboards](https://developer.apple.com/documentation/uikit/creating-a-custom-keyboard)
- [Apple open access](https://developer.apple.com/documentation/uikit/configuring-open-access-for-a-custom-keyboard)
- [Apple text interactions](https://developer.apple.com/documentation/uikit/handling-text-interactions-in-custom-keyboards)
- [Xcode requirements](https://developer.apple.com/xcode/system-requirements)
- [XcodeGen specification](https://github.com/yonaskolb/XcodeGen/blob/master/Docs/ProjectSpec.md)
