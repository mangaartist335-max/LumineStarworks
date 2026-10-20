import { Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon: Icon = Sparkles,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/40 px-6 py-12 text-center", className)}>
      <span className="grid size-11 place-items-center rounded-full bg-accent text-accent-foreground">
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {description && <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
