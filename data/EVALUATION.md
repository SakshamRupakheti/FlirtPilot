# Chat reference development evaluation — September 28, 2026

## Social-reference expansion

Six new synthetic cases were run on the baseline `18e3912` and the 47-reference version `6279294`. `evaluations/social-baseline.json` and `evaluations/social-expanded.json` retain complete outputs. All twelve requests passed schema validation. These are one-shot development comparisons, not a statistical quality benchmark or independent human evaluation.

The expanded version gave a shorter supportive reply and more focused apologies without an unsolicited meetup. Both versions respected the sharing boundary without falsely claiming content was deleted. However, the expanded coworker-gratitude result asked for a returned favor in its risky card, contrary to its reference lesson. Scheduling still introduced unsupported candidate days and enthusiastic pressure. Romanized Hindi stayed in Latin script but became awkward/formal; that case matches no English reference, so differences illustrate generation variability rather than dataset benefit.

The failure exposed conflicting tier instructions: the previous cloud prompt defined Bold as always flirty. Follow-up instructions now define tiers by delivery while preserving the user's goal, keep all platonic tiers platonic, forbid repayment demands in gratitude responses, and require supplied availability before proposing a specific day/time. The local prompt follows the same rules. These are prompt constraints, not deterministic output guarantees. Subsequent results must be assessed separately; no overall accuracy gain is claimed.

Four focused cases were then rerun on `568cad1`; complete outputs are in `evaluations/social-corrected.json`. All four passed schema validation. The gratitude case stopped asking for repayment and privacy still respected the request without false deletion claims. **Scheduling still failed**: the risky reply claimed Saturday was better for the user, despite no supplied availability and the new instruction. Romanized Hindi remained in Latin script but used formal/awkward wording and added a tea suggestion. These failures are unresolved. The release expands topic coverage and corrects conflicting instructions; it does not establish reliable grounding or improved accuracy. Total for this batch: 16 recorded live requests (6 baseline, 6 expanded, 4 corrected), plus 25 passing automated tests, lint, typecheck and production build. No further model calls or paid fallback were run for this release.

The 23-example library is deployed as conditional guidance, **not fine-tuning**. All 3,511 source records were structurally audited, but only the selected situations were adapted for use. No source persona or raw assistant response was imported.

## What was tested

Seven original synthetic adult scenarios were sent to the public `/api/reply` endpoint. Complete inputs/rubrics are in `chat-evaluation.json`; raw synthetic outputs, revision, HTTP status and elapsed time are in `evaluations/`. These files contain no user chats or credentials and are never imported by runtime retrieval.

Each complete run returned seven schema-valid responses. This establishes transport/schema behavior, not seven good answers. An initial 502 occurred on the first 20B-medium attempt; retry succeeded. Earlier unpaced testing also hit the free-tier limit; the runner now waits 30 seconds between requests and stops on an error.

These are development regression cases, assessed by Codex, not independent human judgments or an untouched held-out benchmark. Prompt adjustments used their findings. One generation per case/configuration is insufficient to establish a statistically reliable gain. The low-to-medium comparison also changed the prompt, so it does not isolate reasoning effort.

## Qualitative findings

| Case | 20B, medium reasoning | 120B, medium reasoning |
| --- | --- | --- |
| Follow-up after two hours | Still presumed agreement with “Saturday dinner still works”; did allow waiting | Avoided claiming agreement, but still recommended an immediate nudge |
| Reassuring a friend | Stayed platonic; added an unsupported motive | Stayed platonic; invented being distracted/on autopilot |
| Unanswered invite + story view | Acknowledged uncertainty; no invented venue; still nudged early | Recommended waiting, but risky reply overread story-view curiosity and suggested tonight |
| Friendly ex reconnect | Mostly fit a low-pressure friendly goal | Invented a shared bar, used name placeholders, introduced rekindling despite friendly goal |
| Replying to “haha” about user's trip | Reversed speaker perspective | Assumed a shared trip and introduced flirtation |
| Romanized Hindi | Preserved script; gender/extra facts and tone remained inconsistent | Preserved script; added unsupported availability and a date-like suggestion |
| Explicit no-contact request | Boundary response, no suggested contact | Boundary response, no suggested contact |

## Decision and limitations

Keep the 23 reviewed adaptations and the simpler prompt; retain the faster 20B default with medium reasoning for generation/analysis and low reasoning for draft checks. The 120B trial was reverted because it did not show a clear overall quality gain and was slower in this small run. Both models are offered on Groq's free plan; no paid fallback or account upgrade was enabled.

The current app **still has known quality limitations**: invented excuses/shared memories, inconsistent speaker tracking, and romantic drift when all three tiers should remain platonic. Do not advertise this batch as a proven accuracy improvement, calibrated risk model, US demographic corpus, or completed model training. The next quality work should address grounding and tier definitions, then use new independently reviewed cases; adding more unfiltered source replies would not solve these failures.

The larger-model availability was checked against https://console.groq.com/docs/rate-limits . Exact account quotas may differ; free usage remains rate-limited.
