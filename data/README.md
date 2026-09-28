# Reviewed language reference

Source: [GenZ Slang Evolution Tracker (2020–2025)](https://www.kaggle.com/datasets/likithagedipudi/genz-slang-evolution-tracker-2020-2025), Likitha Gedipudi, version 1. Reviewed September 28, 2026. Kaggle lists CC0: Public Domain.

The publisher describes 535,000+ **synthetic** usage records, not real human conversations. Its age groups include minors. We have NOT imported the full dataset or its user identifiers, usage counts, demographics, or fabricated popularity statistics.

`lib/ai/casual-style.ts` contains six manually reviewed term/meaning pairs from the visible CSV preview (`genz_slang_usage_2020_2025.csv`). `sourceRow` is the preview's zero-based row index. Selected rows were labeled US states and adult age groups: 3 Arizona 18–24, 7 Texas 25–30, 8 California 18–24, 10 Texas 18–24, 14 Texas 18–24, 17 Georgia 31–40. Those labels are synthetic and are not evidence of actual US usage.

Only terms appearing as whole words in the submitted message or draft are included in the server-side AI prompt. The glossary helps interpretation; it does not force slang into replies. It adds no API calls, does not persist user chats, and is not fine-tuning or continuous model training.

DailyDialog was considered but not ingested: mirror licensing claims conflict with reported upstream noncommercial terms. No verified, permissively licensed corpus of authentic US Gen-Z private conversations has been approved. Future corpora require source/license review, adult-only scope, consent/provenance checks for real conversations, and a held-out evaluation before adoption. Private user chats remain separate from this public reference and from opt-in Learning Lab examples.
