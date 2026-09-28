# Reviewed language reference

## Curated chat situations (September 28, 2026)

`curated-chat.json` adds 11 agent-reviewed adaptations of situations from Grenish Rai's [Gen Z SFT Dataset on Kaggle](https://www.kaggle.com/datasets/grenishrai2033d/genz-sft-dataset). The full 2.43 MB JSONL was downloaded from the author's linked [Hugging Face repository](https://huggingface.co/datasets/grenishrai/genz-sft-dataset). Both cards declare MIT; attribution and terms are in `THIRD_PARTY_NOTICES.md`.

All 3,511 records passed structural validation. That is NOT a claim that all records passed a quality or safety review. A dating/texting subset was inspected; 11 situations were chosen with rewritten guidance and replies. The dataset includes age-unspecified and school scenarios, so it is not an adult-only corpus. Selected examples are non-explicit; they never establish the age or consent of anyone in a current request. Existing adult gates and boundaries remain authoritative.

Rejected patterns included certain conclusions from story views, universal bans on double texting, gender assumptions, shaming, excessive slang and forced ALL-CAPS reactions. Source assistant outputs and the fixed system persona were NOT imported. Adaptations are explicitly marked as AI/agent-reviewed, not human-reviewed. They are not representative samples of Americans or evidence of romantic success.

At runtime, whole-phrase matches in the submitted message/draft select at most two examples. Context and safety instructions take priority. Unmatched messages receive no examples, including the Romanized Hindi test case. Phrase matching is intentionally conservative and may miss paraphrases. It is not a semantic search engine. No embeddings, database, additional API call, automatic updates, fine-tuning, or collection of private chats is introduced. The reference adds a bounded prompt cost when matched. Set server `AI_CURATED_EXAMPLES=off` to disable it.

Reproduce the source audit with `node scripts/audit-chat-source.mjs work/genz-source.jsonl`. It checks a pinned SHA-256, all record roles, and each selected source line. Raw downloads stay in ignored `work/`, outside Git. The checked-in `chat-evaluation.json` contains seven separate original test scenarios/rubrics and is never imported by runtime retrieval. Run `node node_modules/tsx/dist/cli.mjs scripts/evaluate-public-chat.ts https://YOUR-APP work/chat-evaluation.json` to test an app explicitly. It sends only those synthetic cases and records revision/schema/latency/output; rubric review is separate. No measured quality improvement is claimed from the small qualitative evaluation.

## Vocabulary reference

Source: [GenZ Slang Evolution Tracker (2020–2025)](https://www.kaggle.com/datasets/likithagedipudi/genz-slang-evolution-tracker-2020-2025), Likitha Gedipudi, version 1. Reviewed September 28, 2026. Kaggle lists CC0: Public Domain.

The publisher describes 535,000+ **synthetic** usage records, not real human conversations. Its age groups include minors. We have NOT imported the full dataset or its user identifiers, usage counts, demographics, or fabricated popularity statistics.

`lib/ai/casual-style.ts` contains six manually reviewed term/meaning pairs from the visible CSV preview (`genz_slang_usage_2020_2025.csv`). `sourceRow` is the preview's zero-based row index. Selected rows were labeled US states and adult age groups: 3 Arizona 18–24, 7 Texas 25–30, 8 California 18–24, 10 Texas 18–24, 14 Texas 18–24, 17 Georgia 31–40. Those labels are synthetic and are not evidence of actual US usage.

Only terms appearing as whole words in the submitted message or draft are included in the server-side AI prompt. The glossary helps interpretation; it does not force slang into replies. It adds no API calls, does not persist user chats, and is not fine-tuning or continuous model training.

DailyDialog was considered but not ingested: mirror licensing claims conflict with reported upstream noncommercial terms. No verified, permissively licensed corpus of authentic US Gen-Z private conversations has been approved. Future corpora require source/license review, adult-only scope, consent/provenance checks for real conversations, and a held-out evaluation before adoption. Private user chats remain separate from this public reference and from opt-in Learning Lab examples.
