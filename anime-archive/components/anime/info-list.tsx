import { cn } from "@/lib/utils";

export function Pending({ children = "Not yet documented" }: { children?: React.ReactNode }) {
  return <span className="text-sm italic text-muted-foreground/80">{children}</span>;
}

export function InfoList({ items, className }: { items: { label: string; value: React.ReactNode; hint?: string }[]; className?: string }) {
  return (
    <dl className={cn("divide-y rounded-xl border bg-card/50", className)}>
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[9.5rem_1fr] gap-3 px-4 py-2.5 text-sm">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="min-w-0 break-words">
            {item.value === null || item.value === undefined || item.value === "" ? <Pending /> : item.value}
            {item.hint && <span className="ml-1.5 text-xs text-muted-foreground">({item.hint})</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Panel({ title, children, className, action }: { title: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
