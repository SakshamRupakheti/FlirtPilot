import type { Question } from "@/lib/ai/schema";
export function ContextQuestionnaire({
  questions,
  context,
  onChange,
}: {
  questions: Question[];
  context: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="question-list">
      {questions.map((q, i) => (
        <fieldset key={q.id}>
          <legend>
            <span className="question-number">0{i + 1}</span>
            {q.question}
          </legend>
          <div className="chips">
            {q.options.map((o) => (
              <button
                type="button"
                className={context[q.id] === o ? "chip selected" : "chip"}
                aria-pressed={context[q.id] === o}
                key={o}
                onClick={() => onChange(q.id, o)}
              >
                {o}
              </button>
            ))}
          </div>
          <input
            aria-label={`${q.question} Your answer`}
            maxLength={2000}
            placeholder="Or tell me in your own words…"
            value={context[q.id] || ""}
            onChange={(e) => onChange(q.id, e.target.value)}
          />
        </fieldset>
      ))}
    </div>
  );
}
