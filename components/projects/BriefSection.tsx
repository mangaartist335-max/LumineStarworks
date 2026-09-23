"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function BriefSection({
  id,
  title,
  onCopy,
  children,
}: {
  id: string;
  title: string;
  onCopy: () => void;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section id={id} className="scroll-mt-20 border-b border-border py-10 first:pt-0 last:border-b-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <button
          type="button"
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy section
            </>
          )}
        </button>
      </div>
      {children}
    </section>
  );
}
