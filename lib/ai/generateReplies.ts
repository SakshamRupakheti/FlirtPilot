import { callProvider } from "./provider";
import type { ReplyRequest } from "./schema";
export async function generateReplies(input: ReplyRequest) {
  return callProvider({ ...input, action: "generate", skipQuestions: true });
}
