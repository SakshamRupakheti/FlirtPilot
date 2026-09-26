"use client";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { setLocal } from "@/lib/local-store";
export function AgeGate({
  open,
  onConfirm,
  localAI = false,
  previewOnly = false,
}: {
  open: boolean;
  onConfirm: () => void;
  localAI?: boolean;
  previewOnly?: boolean;
}) {
  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <span className="gate-icon">♡</span>
        <DialogTitle className="text-2xl">
          Good chemistry. Grown-ups only.
        </DialogTitle>
        <DialogDescription>
          FlirtPilot is for adults. Confirm that you and the person you’re
          talking to are both 18 or older.
        </DialogDescription>
        <button
          className="primary"
          onClick={() => {
            setLocal("adult", true);
            onConfirm();
          }}
        >
          We’re both 18+
        </button>
        <Link className="text-center muted text-sm" href="/">
          Not for me — back to home
        </Link>
        <p className="privacy-note">
          {previewOnly
            ? "This preview does not send your text to an AI service."
            : localAI
              ? "Your messages are processed by a model on this computer. No cloud AI calls. Chats aren’t saved by this app."
              : "Your messages are sent to our AI provider only when you request advice. Chats aren’t saved by this app."}
        </p>
      </DialogContent>
    </Dialog>
  );
}
