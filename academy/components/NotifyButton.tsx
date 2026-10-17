"use client";

import { useState } from "react";
import { BellRing, CircleCheck } from "lucide-react";

// A friendly "let me know" for offerings that aren't open yet. In this
// prototype it only says thanks; nothing is sent anywhere.
export function NotifyButton({ what }: { what: string }) {
  const [asked, setAsked] = useState(false);

  return (
    <div aria-live="polite">
      {asked ? (
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-5 py-3 text-sm font-semibold text-brand-dark">
          <CircleCheck className="h-4 w-4" aria-hidden /> Lovely! We&rsquo;ll let you know when {what} opens.
        </p>
      ) : (
        <button type="button" onClick={() => setAsked(true)} className="btn-primary px-6 py-3.5 text-sm">
          <BellRing className="h-4 w-4" aria-hidden /> Let me know when it opens
        </button>
      )}
    </div>
  );
}
