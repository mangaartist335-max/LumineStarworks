"use client";

import { CircleCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

const EVENT = "archive-toast";

interface Toast {
  id: number;
  message: string;
}

/** Show a short confirmation that outlives the component that triggered it. */
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: message }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let next = 0;
    const onToast = (event: Event) => {
      const id = ++next;
      setToasts((list) => [...list.slice(-2), { id, message: (event as CustomEvent<string>).detail }]);
      window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4500);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border bg-popover px-4 py-3 text-sm shadow-2xl animate-in slide-in-from-bottom-2 fade-in-0">
          <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-prov-confirmed" />
          <p className="flex-1">{t.message}</p>
          <button type="button" aria-label="Dismiss" onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
