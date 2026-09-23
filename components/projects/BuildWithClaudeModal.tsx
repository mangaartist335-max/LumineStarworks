"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function BuildWithClaudeModal({
  open,
  onClose,
  prompt,
}: {
  open: boolean;
  onClose: () => void;
  prompt: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Modal open={open} onClose={onClose} title="Build with Claude" maxWidthClassName="max-w-2xl">
      <p className="mb-4 text-sm text-muted">
        Copy this prompt and paste it into Claude Code (or any Claude-powered
        coding agent) to start building this project immediately.
      </p>
      <pre className="scrollbar-thin max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background-elevated p-4 font-mono text-xs leading-relaxed text-muted">
        {prompt}
      </pre>
      <div className="mt-5 flex justify-end">
        <Button onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied to clipboard
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy prompt
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}
