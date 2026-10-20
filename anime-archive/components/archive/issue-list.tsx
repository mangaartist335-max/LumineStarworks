import { Info, OctagonAlert, TriangleAlert } from "lucide-react";
import type { ValidationIssue } from "@/lib/archive/validation";
import { cn } from "@/lib/utils";

const STYLE = {
  error: { icon: OctagonAlert, className: "border-prov-conflicting/40 bg-prov-conflicting/8 text-prov-conflicting", label: "Needs fixing" },
  warning: { icon: TriangleAlert, className: "border-prov-proposed/40 bg-prov-proposed/8 text-prov-proposed", label: "Check" },
  info: { icon: Info, className: "border-prov-provisional/30 bg-prov-provisional/6 text-prov-provisional", label: "Note" },
} as const;

export function IssueList({ issues, className, empty }: { issues: ValidationIssue[]; className?: string; empty?: React.ReactNode }) {
  if (issues.length === 0) return empty ? <>{empty}</> : null;
  const order = { error: 0, warning: 1, info: 2 };
  return (
    <ul className={cn("space-y-2", className)}>
      {[...issues]
        .sort((a, b) => order[a.level] - order[b.level])
        .map((issue, i) => {
          const s = STYLE[issue.level];
          const Icon = s.icon;
          return (
            <li key={`${issue.code}-${issue.entity_id}-${i}`} className={cn("flex gap-2.5 rounded-lg border px-3 py-2 text-sm", s.className)}>
              <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span className="text-foreground/90">
                <span className="sr-only">{s.label}: </span>
                {issue.message}
              </span>
            </li>
          );
        })}
    </ul>
  );
}
