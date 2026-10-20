import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteRecordAction } from "@/app/admin/actions";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import type { Option } from "@/lib/archive/forms";
import { rowToValues } from "@/lib/archive/forms";
import type { EntityType, Provenance } from "@/lib/archive/types";
import { ActionForm } from "./action-form";
import { EntityForm } from "./entity-form";

export interface ChildRow {
  id: string;
  title: string;
  subtitle?: string;
  provenance: Provenance;
  row: Record<string, unknown>;
}

/** A list of child records (credits, runs, cast…) with inline edit, remove and an add form. */
export function ChildSection({
  entity,
  title,
  description,
  rows,
  fixed,
  references,
  sources,
  addLabel,
  emptyText,
  defaults,
}: {
  entity: EntityType;
  title: string;
  description?: string;
  rows: ChildRow[];
  fixed: Record<string, string>;
  references: Partial<Record<EntityType, Option[]>>;
  sources: Option[];
  addLabel: string;
  emptyText: string;
  defaults?: Record<string, string>;
}) {
  return (
    <section className="space-y-4 rounded-xl border bg-card/40 p-5">
      <div>
        <h2 className="font-semibold">
          {title} <span className="font-normal text-muted-foreground">({rows.length})</span>
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-background/40">
          {rows.map((r) => (
            <li key={r.id}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/30 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{r.title}</span>
                    {r.subtitle && <span className="block truncate text-xs text-muted-foreground">{r.subtitle}</span>}
                  </span>
                  <ProvenanceBadge provenance={r.provenance} compact />
                  <Pencil aria-hidden className="size-3.5 text-muted-foreground group-open:text-primary" />
                  <span className="sr-only">Edit</span>
                </summary>
                <div className="space-y-4 border-t bg-card/40 p-4">
                  <EntityForm entity={entity} id={r.id} values={rowToValues(entity, r.row)} fixed={fixed} references={references} sources={sources} />
                  <ActionForm
                    action={deleteRecordAction}
                    fields={{ __entity: entity, __id: r.id }}
                    label="Remove"
                    variant="ghost"
                    icon={<Trash2 aria-hidden />}
                    confirm={`Remove “${r.title}”? It stays in the revision history and can be restored.`}
                    className="[&_button]:text-destructive"
                  />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <details className="rounded-lg border border-dashed">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-sm font-medium text-primary [&::-webkit-details-marker]:hidden">
          <Plus aria-hidden className="size-4" /> {addLabel}
        </summary>
        <div className="border-t p-4">
          <EntityForm entity={entity} values={{ provenance: "provisional", ...defaults }} fixed={fixed} references={references} sources={sources} submitLabel={addLabel} />
        </div>
      </details>
    </section>
  );
}
