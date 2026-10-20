import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("relative overflow-hidden border-b", className)}>
      <div aria-hidden className="starfield absolute inset-0 opacity-60" />
      <div aria-hidden className="absolute -top-24 left-1/3 h-56 w-[36rem] rounded-full bg-glow blur-3xl" />
      <div className="container-page relative flex flex-wrap items-end justify-between gap-6 py-10 sm:py-12">
        <div className="max-w-3xl space-y-2">
          {eyebrow && <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</div>}
          <h1 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h1>
          {description && <div className="text-base text-muted-foreground">{description}</div>}
        </div>
        {children}
      </div>
    </header>
  );
}
