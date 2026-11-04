# FlirtPilot model and keyboard plan

## Website first

Use an existing hosted model behind server-side `/api/reply`. Groq is the first free-tier pilot option; no training job, paid fallback or API key in the browser. Free inference is rate-limited and is not a promise of unlimited usage or free fine-tuning. Evaluate real output before calling the integration production-ready. Local Ollama remains an optional developer setup, not a mobile-user requirement.

## Native keyboards

The iPhone app installs a custom keyboard extension through iOS Settings. Android needs an app with an InputMethodService. Each can display a small FlirtPilot button and suggestion strip, and insert the chosen text without sending the message. The website can reuse its AI backend, but a web/PWA install cannot register a system keyboard.

Keep low-cost local spelling/completion active while typing. Initially request contextual AI only on tap; evaluate opt-in, debounced, cancelable suggestions later. Never silently upload every keystroke. iOS provides limited editable-field context, not the chat history above it. Additional conversation context must be deliberately supplied. Secure fields and apps that disable third-party keyboards may use the system keyboard.

The current native pilot on `codex/keyboard-offline-pilot` is offline basic editing only, not full conversation AI. Signed builds and device tests are still outstanding; do not conflate this with the deployed website.

## Do not start by collecting entire private chat histories

Start with a small curated evaluation set (for example, 200–500 scenarios) and improve prompts. This is a suggested initial review size, not a threshold guaranteeing model quality. Use written scenarios, clearly labeled synthetic examples, and voluntarily contributed adult-only excerpts. Synthetic data must be reviewed for repetitive or stereotyped replies.

For any real contribution, obtain explicit permission from every participant for the intended research/training use. Consent to chatting or to receiving advice is not consent to model training. Do not scrape private DMs, buy leaked datasets, or assume one participant can donate another person's identifiable messages. Remove names, handles, phone numbers, photos, links, locations and identifying details. Redaction reduces risk but does not guarantee anonymity. Keep consent provenance outside the training text and honor withdrawal/deletion processes.

Keep only the smallest useful excerpt, often a few preceding turns, with:

- Language/script and style, including transliteration when applicable.
- Relationship context, user goal and relevant timing provided by the contributor.
- Conversation turns with neutral participant IDs.
- What is ambiguous and what follow-up questions are actually needed.
- Several acceptable replies with brief reasons, not one supposedly perfect answer.
- Rejected replies and reviewer reasons such as unnatural wording, too intense, unsupported inference or boundary violation.
- Source type (written/synthetic/consented-real), consent record reference and dataset version.

Cover flirting, platonic ambiguity, nonresponse, rejection, explicit no-contact boundaries, different genders/orientations, language styles and relationship goals. Do not treat another person's attraction or intentions as known truth. Don't fabricate a romantic outcome label.

## Evaluation before training

Keep an untouched test split separated by person/conversation/source, not random adjacent messages, to prevent leakage. Review context fidelity, naturalness, language/style preservation, uncertainty, boundary respect, useful follow-up questions, response diversity, latency and schema validity. Compare to the unmodified base model.

Copying a reply measures selection, not romantic success. Avoid optimizing for pressure or persistence. After finding repeatable failures, consider supervised fine-tuning on reviewed context→reply examples or preference pairs. This requires a separate supported training provider, budget, data governance and evaluation; the current free API integration does not train or remember the model.

Local relationship memory, operational analytics, and consented research data remain separate. No collection or training pipeline is enabled by this document.
