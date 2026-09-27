"use client";
import { useState } from "react";
import {
  learningExampleSchema,
  readExamples,
  saveExamples,
  redactCommonIdentifiers,
  type LearningExample,
} from "@/lib/learning";

export function LearningEditor({
  initial = "",
  source = "typed",
  onSaved,
}: {
  initial?: string;
  source?: LearningExample["source"];
  onSaved?: () => void;
}) {
  const [conversation, setConversation] = useState(initial);
  const [preferredReply, setReply] = useState("");
  const [lesson, setLesson] = useState("");
  const [group, setGroup] = useState("");
  const [split, setSplit] = useState<LearningExample["split"]>("practice");
  const [reviewed, setReviewed] = useState(false),
    [share, setShare] = useState(false);
  const [notice, setNotice] = useState("");
  return (
    <form
      className="learning-form"
      onSubmit={(event) => {
        event.preventDefault();
        try {
          const entry = learningExampleSchema.parse({
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            conversation,
            preferredReply,
            lesson,
            group,
            split,
            source,
            consent: { version: 1, adults: reviewed, reviewed, share },
          });
          saveExamples([...readExamples(), entry]);
          setConversation("");
          setReply("");
          setLesson("");
          setReviewed(false);
          setShare(false);
          setNotice("Saved on this device. Nothing uploaded or trained.");
          onSaved?.();
        } catch (error) {
          setNotice(
            error instanceof Error && error.message.startsWith("Keep the same")
              ? error.message
              : "Could not save. Complete every field and review checkbox, or check browser storage (maximum 200 examples).",
          );
        }
      }}
    >
      <label>
        Conversation and context
        <textarea
          required
          maxLength={1800}
          value={conversation}
          onChange={(e) => {
            setConversation(e.target.value);
            setReviewed(false);
          }}
          placeholder={"Me: …\nThem: …\nContext, language, and what I wanted…"}
        />
      </label>
      <button
        type="button"
        className="text-button"
        onClick={() => {
          setConversation(redactCommonIdentifiers(conversation));
          setReply(redactCommonIdentifiers(preferredReply));
          setLesson(redactCommonIdentifiers(lesson));
          setReviewed(false);
        }}
      >
        Remove common emails, handles, links and phone numbers
      </button>
      <p className="privacy-note">
        This helper cannot remove every identifier. Review names, locations and
        personal details yourself. Save a useful excerpt, not an entire private
        history.
      </p>
      <label>
        A reply you would actually send
        <textarea
          required
          maxLength={600}
          value={preferredReply}
          onChange={(e) => {
            setReply(e.target.value);
            setReviewed(false);
          }}
        />
      </label>
      <label>
        What should we learn? What was wrong or better?
        <textarea
          required
          maxLength={600}
          value={lesson}
          onChange={(e) => {
            setLesson(e.target.value);
            setReviewed(false);
          }}
          placeholder="Too formal; keep my lowercase style. A maybe isn't a yes."
        />
      </label>
      <label>
        Anonymous person/conversation group
        <input
          required
          maxLength={80}
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder="person-01 (reuse for their other examples)"
        />
      </label>
      <label>
        Use this example for
        <select
          value={split}
          onChange={(e) => setSplit(e.target.value as LearningExample["split"])}
        >
          <option value="practice">Practice — can guide my replies</option>
          <option value="evaluation">
            Evaluation — held back from suggestions
          </option>
        </select>
      </label>
      <label className="learning-check">
        <input
          type="checkbox"
          required
          checked={reviewed}
          onChange={(e) => setReviewed(e.target.checked)}
        />
        Everyone involved is 18+. I reviewed all fields, removed identifying
        details, and want to save this example on this device.
      </label>
      <label className="learning-check">
        <input
          type="checkbox"
          checked={share}
          onChange={(e) => setShare(e.target.checked)}
        />
        Also include this in dataset exports. I have the participants’
        permission to use this excerpt for shared model improvement. This does
        not upload it.
      </label>
      <button className="primary" type="submit">
        Save reviewed example
      </button>
      <p role="status">{notice}</p>
    </form>
  );
}
