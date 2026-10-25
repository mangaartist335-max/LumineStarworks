"use client";

import { useId, useState, type ReactNode } from "react";

export function Spoiler({ title, children }: { title: string | null; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="spoiler" data-hidden={open ? "false" : "true"}>
      <div className="spoiler-head">
        Spoiler{title ? `: ${title}` : ""}{" "}
        <button
          type="button"
          className="spoiler-toggle"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>
      <div className="spoiler-body" id={id} hidden={!open}>
        {children}
      </div>
    </div>
  );
}
