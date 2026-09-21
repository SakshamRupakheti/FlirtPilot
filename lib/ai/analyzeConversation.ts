import { callProvider } from "./provider";
import type { ReplyRequest } from "./schema";
export async function analyzeConversation(input: ReplyRequest) {
  return callProvider({ ...input, action: "analyze" });
}
