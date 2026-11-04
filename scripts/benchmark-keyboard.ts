import { callProvider } from "../lib/ai/provider";
import { requestSchema } from "../lib/ai/schema";
import { suggestKeyboard, keyboardRequest } from "../lib/ai/keyboard";

if (process.env.AI_PROVIDER !== "ollama")
  throw new Error("Benchmark requires local Ollama; no paid calls are made.");
const message = "want to grab coffee this weekend?";
const tasks = [
  {
    name: "Full analysis",
    run: () =>
      callProvider(
        requestSchema.parse({
          message,
          context: {
            relationship: "Both 24, a new match",
            goal: "Go on a date",
          },
          adultConfirmed: true,
          skipQuestions: true,
          action: "generate",
        }),
      ),
  },
  {
    name: "Keyboard suggestions",
    run: () =>
      suggestKeyboard(
        keyboardRequest.parse({
          draft: message,
          mode: "rewrite",
          adultConfirmed: true,
        }),
      ),
  },
];
for (const task of tasks) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const start = performance.now();
    try {
      const result = await task.run();
      console.log(
        JSON.stringify({
          path: task.name,
          sample: attempt,
          seconds: Number(((performance.now() - start) / 1000).toFixed(2)),
          status: result.status,
        }),
      );
    } catch (error) {
      console.log(
        JSON.stringify({
          path: task.name,
          sample: attempt,
          seconds: Number(((performance.now() - start) / 1000).toFixed(2)),
          error: error instanceof Error ? error.message : "failed",
        }),
      );
      process.exitCode = 1;
    }
  }
}
