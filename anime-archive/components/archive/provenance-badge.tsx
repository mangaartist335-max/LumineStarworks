import { CircleCheck, CircleDashed, CircleHelp, CircleSlash, TriangleAlert } from "lucide-react";
import { PROVENANCE_DESCRIPTION, PROVENANCE_LABEL } from "@/lib/archive/labels";
import type { Provenance } from "@/lib/archive/types";
import { cn } from "@/lib/utils";

const STYLE: Record<Provenance, string> = {
  confirmed: "border-prov-confirmed/40 bg-prov-confirmed/12 text-prov-confirmed",
  provisional: "border-prov-provisional/40 bg-prov-provisional/12 text-prov-provisional",
  proposed: "border-dashed border-prov-proposed/60 bg-prov-proposed/10 text-prov-proposed",
  conflicting: "border-prov-conflicting/50 bg-prov-conflicting/12 text-prov-conflicting",
  superseded: "border-prov-superseded/40 bg-prov-superseded/10 text-prov-superseded line-through decoration-1",
};

const ICON: Record<Provenance, typeof CircleCheck> = {
  confirmed: CircleCheck,
  provisional: CircleHelp,
  proposed: CircleDashed,
  conflicting: TriangleAlert,
  superseded: CircleSlash,
};

export function ProvenanceBadge({ provenance, className, compact = false }: { provenance: Provenance; className?: string; compact?: boolean }) {
  const Icon = ICON[provenance];
  return (
    <span
      title={PROVENANCE_DESCRIPTION[provenance]}
      className={cn("inline-flex w-fit shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide", STYLE[provenance], className)}
    >
      <Icon aria-hidden className="size-3" />
      {compact ? <span className="sr-only">{PROVENANCE_LABEL[provenance]}</span> : PROVENANCE_LABEL[provenance]}
    </span>
  );
}
