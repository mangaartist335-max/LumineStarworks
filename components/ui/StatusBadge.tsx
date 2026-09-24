import { cn } from "@/lib/utils";
import { STATUS_LABELS, type ProjectStatus } from "@/lib/types";

const statusStyles: Record<ProjectStatus, string> = {
  planning: "bg-muted-foreground/10 text-muted border-muted-foreground/25",
  ready_to_build: "bg-accent/10 text-accent border-accent/30",
  building: "bg-warning/10 text-warning border-warning/30",
  completed: "bg-success/10 text-success border-success/30",
};

const statusDot: Record<ProjectStatus, string> = {
  planning: "bg-muted-foreground",
  ready_to_build: "bg-accent",
  building: "bg-warning",
  completed: "bg-success",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", statusDot[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}
