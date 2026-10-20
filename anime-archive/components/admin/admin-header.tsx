export function AdminHeader({ title, description, children }: { title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {description && <div className="max-w-2xl text-sm text-muted-foreground">{description}</div>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
