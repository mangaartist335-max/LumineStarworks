import { Skeleton } from "@/components/ui/skeleton";

export function HeaderSkeleton() {
  return (
    <div className="border-b">
      <div className="container-page space-y-3 py-12">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[2/3] w-full rounded-lg" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ label = "Loading the archive" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}…</span>
      <HeaderSkeleton />
      <div className="container-page py-10">
        <GridSkeleton />
      </div>
    </div>
  );
}
