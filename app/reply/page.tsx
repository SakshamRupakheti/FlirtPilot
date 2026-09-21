import { ReplyWorkspace } from "@/components/flirtpilot/reply-workspace";
export default function ReplyPage() {
  return <ReplyWorkspace localAI={process.env.AI_PROVIDER === "ollama"} />;
}
