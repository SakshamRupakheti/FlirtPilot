"use client";
import { useEffect, useState } from "react";
import { AppShell } from "./shell";
import { LearningEditor } from "./learning-editor";
import { EvaluateExample } from "./evaluate-example";
import {
  readExamples,
  saveExamples,
  exportDataset,
  type LearningExample,
} from "@/lib/learning";

export function LearningLab() {
  const [examples, setExamples] = useState<LearningExample[]>([]),
    [notice, setNotice] = useState("");
  const [draft, setDraft] = useState(""),
    [version, setVersion] = useState(0);
  const [source, setSource] = useState<LearningExample["source"]>("typed");
  const [image, setImage] = useState<string | null>(null);
  function refresh() {
    try {
      setExamples(readExamples());
    } catch {
      setNotice(
        "Browser storage is unavailable or invalid. Existing data has not been overwritten.",
      );
    }
  }
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    refresh();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image);
    },
    [image],
  );
  function download(split: LearningExample["split"]) {
    const content = exportDataset(examples, split);
    if (!content) {
      setNotice("No examples in this set have permission for export.");
      return;
    }
    const url = URL.createObjectURL(
      new Blob([content], { type: "application/x-ndjson" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `flirtpilot-${split}.jsonl`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      "Downloaded approved examples. Keep this file private; deleting a local example does not delete exported copies.",
    );
  }
  return (
    <AppShell>
      <main className="learning-lab">
        <p className="eyebrow">LEARNING LAB · PRIVATE TO THIS DEVICE</p>
        <h1>Better replies start with your corrections.</h1>
        <p>
          Review real examples, explain what sounds right, and build a dataset
          you control. This is a learning library, not automatic model training.
        </p>
        <div className="learning-grid">
          <section className="workflow-panel">
            <h2>Review an example</h2>
            <p>
              Import a UTF-8 .txt chat excerpt or preview a screenshot. Images
              stay in this tab and are never saved or uploaded. Screenshot
              transcription is manual in this version.
            </p>
            <label className="learning-upload">
              Import text or screenshot
              <input
                type="file"
                accept=".txt,image/png,image/jpeg,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  e.target.value = "";
                  if (file.size > 5 * 1024 * 1024) {
                    setNotice("Choose a file smaller than 5 MB.");
                    return;
                  }
                  if (
                    ["image/png", "image/jpeg", "image/webp"].includes(
                      file.type,
                    )
                  ) {
                    setImage(URL.createObjectURL(file));
                    setDraft("");
                    setSource("screenshot");
                    setVersion((v) => v + 1);
                  } else if (file.name.toLowerCase().endsWith(".txt")) {
                    try {
                      const text = await file.text();
                      setDraft(text.slice(0, 1800));
                      setImage(null);
                      setSource("file");
                      setVersion((v) => v + 1);
                      setNotice(
                        text.length > 1800
                          ? "Loaded the first 1,800 characters. Choose a focused excerpt before saving."
                          : "Text loaded for review. Nothing saved yet.",
                      );
                    } catch {
                      setNotice(
                        "Could not read this file. Paste an excerpt instead.",
                      );
                    }
                  } else
                    setNotice("Use a .txt file or PNG, JPEG or WebP image.");
                }}
              />
            </label>
            {image && (
              <div className="screenshot-review">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="Your screenshot, for local transcription and review"
                />
                <p>
                  Transcribe the relevant exchange below using Me/Them labels.
                  Correct order, emojis and timestamps where useful.
                </p>
                <button className="text-button" onClick={() => setImage(null)}>
                  Remove screenshot preview
                </button>
              </div>
            )}
            <LearningEditor
              key={version}
              initial={draft}
              source={source}
              onSaved={refresh}
            />
          </section>
          <section className="workflow-panel">
            <h2>Your reviewed library</h2>
            <p>
              {examples.length} / 200 examples ·{" "}
              {examples.filter((e) => e.split === "evaluation").length} reserved
              for evaluation
            </p>
            <p>
              Practice examples can guide replies only when you enable that
              option in Reply. Evaluation examples are never sent as guidance.
              Keep each person in one set.
            </p>
            <div className="learning-actions">
              <button
                className="secondary"
                onClick={() => download("practice")}
              >
                Export approved practice JSONL
              </button>
              <button
                className="secondary"
                onClick={() => download("evaluation")}
              >
                Export approved evaluation JSONL
              </button>
            </div>
            <p className="privacy-note">
              Exports contain only examples with sharing permission. They
              require further review before training. No shared database,
              automatic upload, or model weight updates are enabled.
            </p>
            <p role="status">{notice}</p>
            {examples.length === 0 && (
              <p>Your first correction starts here. Saving is optional.</p>
            )}
            {examples.map((entry) => (
              <article className="learning-entry" key={entry.id}>
                <strong>
                  {entry.group} · {entry.split}
                </strong>
                <p>{entry.conversation}</p>
                <p>
                  <b>Preferred:</b> {entry.preferredReply}
                </p>
                <p>
                  <b>Lesson:</b> {entry.lesson}
                </p>
                {entry.split === "evaluation" && (
                  <EvaluateExample example={entry} />
                )}
                <label className="learning-check">
                  <input
                    type="checkbox"
                    checked={entry.consent.share}
                    onChange={(event) => {
                      try {
                        const updated = examples.map((e) =>
                          e.id === entry.id
                            ? {
                                ...e,
                                consent: {
                                  ...e.consent,
                                  share: event.target.checked,
                                },
                              }
                            : e,
                        );
                        saveExamples(updated);
                        setExamples(updated);
                      } catch {
                        setNotice("Could not update browser storage.");
                      }
                    }}
                  />
                  Participants permitted shared improvement; include in exports
                </label>
                <button
                  className="text-button"
                  onClick={() => {
                    try {
                      const updated = examples.filter((e) => e.id !== entry.id);
                      saveExamples(updated);
                      setExamples(updated);
                      setNotice(
                        "Deleted from this device. Previously exported copies are unaffected.",
                      );
                    } catch {
                      setNotice("Could not delete from browser storage.");
                    }
                  }}
                >
                  Delete example
                </button>
              </article>
            ))}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
