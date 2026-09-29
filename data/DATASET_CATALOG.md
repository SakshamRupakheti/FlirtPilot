# Public corpus sourcing — September 28, 2026

This implements the user's supplied public/ethical dataset research as a **reference-data release**, not a model training run. No hosted model weights changed and no private user conversations were downloaded. A larger raw corpus is not evidence of better advice.

## Source decisions

| Source | Primary evidence | Decision for this release |
| --- | --- | --- |
| SODA, Hyunwoo Kim et al. / Allen Institute for AI | [Publisher card](https://huggingface.co/datasets/allenai/soda), CC BY 4.0, synthetic | Downloaded 1,000 deterministic training-split rows across ten offsets. Twelve newly written adult situations adapt selected themes. No raw dialogue is used as a preferred reply. |
| PersonaConflicts, Jocelyn Shen et al. / MIT Media Lab | [Publisher repository](https://github.com/mitmedialab/persona-conflicts-corpus-emnlp-2025), MIT, simulated | Downloaded 5,772 rows and synthetic age profiles. Twelve scenario themes adapted into de-escalation/support guidance. Adversarial conflict utterances are not imitated. |
| MaiChat, Dao, Lai and Bell | [Publisher release](https://doi.org/10.7488/ds/8083), [README](https://datashare.ed.ac.uk/server/api/core/bitstreams/1fa2c7f0-d3e1-45da-a264-446b49206e8f/content) | Confirmed release consent, ethics approval and CC BY-SA 4.0. README says demographic metadata is absent. No conversations imported pending adult-scope verification; no typing logs collected. |
| PersonaChat | [Task-level license](https://raw.githubusercontent.com/facebookresearch/ParlAI/main/parlai/tasks/personachat/LICENSE_DOCUMENTATION), [collection overview](https://parl.ai/docs/tasks.html) | CC BY 4.0 verified; crowdworkers use assigned personas. Not imported: adult participant / intended-use consent evidence still needs review. Do not infer data terms from the ParlAI software license. |
| BYU Chit-Chat | [Publisher repository](https://github.com/BYU-PCCL/chitchat-dataset) | Public repository lists MIT and anonymized IDs; README does not establish adult-only release consent. No chat data imported. |
| EmpatheticDialogues | [Publisher task documentation](https://parl.ai/docs/tasks.html) | CC BY-NC. Excluded from this production corpus. |
| Blended Skill Talk / DailyDialog | [Publisher task documentation](https://parl.ai/docs/tasks.html) | Not imported; component/research-use terms require source-specific review. |
| Speed Dating survey / Stanford SpeedDate | User-supplied research shortlist | Not imported. Survey rows are not chat replies; no transcript release/license verified in this sourcing pass. |
| FlirtFlip / FlirtationFeatureSet / Russian romantic logs / Tinder screenshots | User-supplied exclusions | Not fetched or imported. The supplied research excludes these on content/provenance grounds. |
| ProsocialDialog | User-supplied conditional source | Not fetched or imported into reply generation; would require a separate safety-data review. |

## Exact artifact layers

This release downloaded **6,772 conversations in 22,502,841 bytes** of source files and documentation. The strict parser normalized **6,744 conversations / 90,826 turns** into the local quarantine and rejected **28** malformed/unsupported records. These counts are not approved training-example counts; only the **24** separate rewritten additions enter the 47-example runtime library.

- `social-reference.json`: 24 agent-reviewed, rewritten adult examples, with source name, zero-based source row and original source ID. PersonaConflicts IDs repeat; the row index and snapshot hash disambiguate them. The legacy 23 examples and six slang terms remain.
- `public-corpus-audit.json`: exact source URLs, SHA-256 hashes, byte sizes, row/turn counts and rejected records. Hashes are of downloaded bytes; upstream changes require explicit re-review.
- `work/public-corpus-quarantine.jsonl`: normalized synthetic source material, **not approved for training or production**. All records retain that status even when character profiles are adults. No runtime module imports it.
- `social-evaluation.json`: six original regression cases, never used by reference retrieval. Outputs and qualitative findings belong in `evaluations/` and `EVALUATION.md` after comparison.

Normalization checks the source structure, preserves speakers and original sequence, and removes source profile secrets/backstories from the normalized records. Three SODA records have a speaker/turn mismatch. PersonaConflicts uses multiple formats; records the strict parser cannot resolve remain rejected rather than guessing a speaker. Downloaded bytes stay available locally for later parser review. Regex/structure checks do not establish safety, consent, quality, or absence of identifying text.

The new runtime examples are original adaptations of themes, including counterexamples where the original source gave poor advice. They contain fictional adult context, not inferred age labels on the source. Review is by Codex, not independent human annotation. Do not advertise them as authentic American/Gen-Z messages or successful romantic outcomes.

## Reproduce

From the repository root:

```text
node scripts/prepare-public-corpus.mjs --download
node scripts/prepare-public-corpus.mjs
node node_modules/tsx/dist/cli.mjs scripts/evaluate-public-chat.ts https://YOUR-APP work/social-evaluation.json 0 social
```

The downloader uses public HTTPS sources and no credentials; it skips existing files. The audit fails on changed pinned snapshots unless `--refresh` is explicitly supplied after review. Raw data remains in ignored `work/`; checked-in hashes allow verifying a recovered download. The HF viewer API may change metadata over time, so byte hashes can change even when row text has not. Review the difference rather than blindly refreshing.

No paid inference, embeddings, training job, consent collection, or automatic ingestion was added. Runtime remains bounded to two relevant examples and can be disabled with `AI_CURATED_EXAMPLES=off`. Adding a file to the quarantine never automatically makes it a model example.
