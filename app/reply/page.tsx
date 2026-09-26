import { ReplyWorkspace } from "@/components/flirtpilot/reply-workspace";
import { isHostedPreview } from "@/lib/ai/deployment";
export const dynamic = "force-dynamic";
export default function ReplyPage() {
  return (
    <ReplyWorkspace
      localAI={!isHostedPreview() && process.env.AI_PROVIDER === "ollama"}
      previewOnly={isHostedPreview()}
    />
  );
}
