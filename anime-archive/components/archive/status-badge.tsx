import type { ProductionStatus } from "@/lib/archive/queries";
import { cn } from "@/lib/utils";

const LABEL: Record<ProductionStatus, string> = {
  upcoming: "Upcoming",
  airing: "Airing",
  finished: "Finished",
  released: "Released",
  undated: "Date pending",
};

const STYLE: Record<ProductionStatus, string> = {
  upcoming: "bg-star/15 text-star",
  airing: "bg-prov-confirmed/15 text-prov-confirmed",
  finished: "bg-muted text-muted-foreground",
  released: "bg-muted text-muted-foreground",
  undated: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: ProductionStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[0.7rem] font-semibold", STYLE[status], className)}>
      {status === "airing" && <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-current" />}
      {LABEL[status]}
    </span>
  );
}
