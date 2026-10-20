import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  eyebrow,
  description,
  href,
  linkLabel = "View all",
  className,
  id,
}: {
  title: string;
  eyebrow?: string;
  description?: React.ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="space-y-1">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
        <h2 id={id} className="text-xl font-bold tracking-tight sm:text-2xl">
          {title}
        </h2>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          {linkLabel}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
