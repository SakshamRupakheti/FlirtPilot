import { DraftChecker } from "@/components/flirtpilot/draft-checker";
export const dynamic = "force-dynamic";
export default function CheckPage() {
  return <DraftChecker localAI={process.env.AI_PROVIDER === "ollama"} />;
}
