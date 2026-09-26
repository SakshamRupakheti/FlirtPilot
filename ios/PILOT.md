# Private keyboard pilot — no website deployment

## What this pilot actually does

- Native QWERTY, symbols, shift, backspace, space, return and globe switching.
- Apple dictionary completions/corrections after a 120 ms typing pause. Limited built-in next-word phrase continuations, without network calls.
- **Polish** previews small spacing/apostrophe fixes. It does not replace text without a tap, invent flirt replies, infer feelings, or claim full grammar correction.
- **Undo** restores the replaced excerpt only while the document, cursor and content still match. Cursor movement, selected text, typing and document switches invalidate stale suggestions. Replacements are limited to visible context, not hidden chat history.
- Companion practice field and checklist. Text/checklist values are transient. Only the adult confirmation is persisted locally by the keyboard.
- Network transport and shared credential code are excluded from the pilot targets. No Full Access, tunnel, API key, server or runtime laptop connection is needed.

This is a real native keyboard source implementation, not a web keyboard mockup. It is **not yet an installable or device-tested build**. Full AI Safe/Bold/Risky generation needs a separate inference design; no fake model or canned romantic output stands in for it here.

## Build and validation

`PilotCore` is a portable Swift package. `swift test --package-path ios/PilotCore` checks style/script preservation, cleanup, phrase boundaries and document snapshot invalidation. Linux CI additionally parses the active Swift UI source; parsing is not UIKit/SwiftUI typechecking.

On a macOS host with Xcode and XcodeGen:

```sh
cd ios
xcodegen generate
xcodebuild -project FlirtPilot.xcodeproj -scheme FlirtPilot -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

The manual `ios-build.yml` workflow also builds an unsigned iPhone payload and uploads `FlirtPilot-Pilot-UNSIGNED.ipa` as a private Actions artifact for seven days. It performs no App Store, TestFlight or website deployment and contains no signing secrets. It is not dispatched automatically; a macOS runner can consume paid minutes if the account's included allowance is exhausted. Check the allowance and a zero-overage spending limit before requesting this build. A workflow existing only on a feature branch may not appear in GitHub's manual Run menu until available on the default branch.

## Installing without an Apple Developer membership

An unsigned IPA cannot be installed directly from a website. A macOS build host is still needed to compile the iOS SDK code, even if you use Windows to sign/install the resulting private IPA with a tool such as AltStore Classic. AltStore documents Windows installation, regular Apple IDs and seven-day refreshes; keyboard-extension signing still needs verification for this specific artifact. Keep the keyboard extension when installing. This path is not TestFlight and is not confirmed working for FlirtPilot yet.

Do not enter Apple credentials into chat, code, GitHub secrets or the FlirtPilot app. Installation and Apple sign-in must be completed by the device owner. You would need the computer for installation/periodic re-signing, **not for typing suggestions at runtime**.

Official references: [Apple custom keyboards](https://developer.apple.com/documentation/uikit/creating-a-custom-keyboard), [Apple beta distribution](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases), [AltStore Windows installation](https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows), [AltStore seven-day refresh](https://faq.altstore.io/altstore-classic/your-altstore), [extension App IDs](https://faq.altstore.io/altstore-classic/app-ids).

## iPhone 14 pilot checklist — after a signed install exists

1. Enable the keyboard in Settings → General → Keyboard → Keyboards. Use the globe key in the companion app or Notes. Complete the adult gate.
2. In airplane mode, type `want to ` and check the local next-word suggestions. Type a partial English word and check dictionary suggestions.
3. Load `im  free tomorrow !`, tap Polish, preview/apply cleanup, and Undo. Confirm text is restored and nothing is sent automatically.
4. Move the cursor or select text before applying a stale suggestion. It must not overwrite that selection or edit another field. Switch to another document with identical text and check again.
5. Test emoji, Romanized Hindi, Arabic, links and a long draft. Polish must not rewrite supported non-English text or links into English; the current keyboard layout itself is English only.
6. Test landscape, VoiceOver, fast typing, switching keyboards and secure fields. This pilot does not implement swipe typing, dictation, long-press accents or delete-repeat.
7. Report the app, exact steps and expected/actual behavior using synthetic example text. No chat log upload is needed.

Only after the user tests and approves the pilot should a release/deployment be proposed. `vercel.json` disables Git-triggered deployments on this branch; never merge that control into production without reviewing the intended deployment behavior.
