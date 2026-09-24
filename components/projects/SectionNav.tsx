"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BRIEF_SECTIONS } from "@/lib/types";

export function SectionNav() {
  const [active, setActive] = useState(BRIEF_SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    BRIEF_SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <nav className="scrollbar-thin sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pl-1">
      <p className="mb-3 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-0.5 border-l border-border">
        {BRIEF_SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={cn(
                "-ml-px block border-l-2 px-3 py-1.5 text-[13px] transition-colors",
                active === section.id
                  ? "border-accent text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
