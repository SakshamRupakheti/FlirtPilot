# Chat reference development evaluation — September 28, 2026

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
