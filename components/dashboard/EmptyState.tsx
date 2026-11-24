import { Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-accent">
        <Sparkles className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold">No projects yet</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">
        Describe your first idea and BuildBrief will plan it and build a
        working app you can play with.
      </p>
      <ButtonLink href="/projects/new" className="mt-5">
        Make your first app
      </ButtonLink>
    </div>
  );
}
