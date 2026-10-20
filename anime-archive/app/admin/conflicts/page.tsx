import { Check, GitPullRequestArrow, Undo2 } from "lucide-react";
import Link from "next/link";
import { resolveConflictAction } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { AdminHeader } from "@/components/admin/admin-header";
import { EmptyState } from "@/components/archive/empty-state";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { Input } from "@/components/ui/input";
import { formatTimestamp } from "@/lib/archive/dates";
import { ENTITY_LABEL } from "@/lib/archive/labels";
import { describeRow, findRow } from "@/lib/archive/mutations";
import { loadArchive } from "@/lib/archive/server";

export const metadata = { title: "Conflict review" };

function show(value: unknown): string {
  if (value === null || value === undefined) return "—";
  return typeof value === "string" ? value : JSON.stringify(value);
}

export default async function ConflictsPage() {
  const index = await loadArchive();
  const conflicts = [...index.tables.record_conflicts].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const open = conflicts.filter((c) => c.status === "open");
  const resolved = conflicts.filter((c) => c.status !== "open").slice(0, 30);

  const linkFor = (entity: string, id: string) => {
    if (entity === "production") return `/admin/productions/${id}`;
    if (["franchise", "studio", "person", "company", "music_track", "source_document"].includes(entity)) return `/admin/records/${entity}/${id}`;
    const row = findRow(index.tables, entity as never, id);
    return row && "production_id" in row ? `/admin/productions/${row.production_id}` : null;
  };

  return (
    <>
      <AdminHeader
        title="Conflicting records"
        description="When an import disagrees with what's already on record, the new value waits here. Accept it to apply the correction, or keep the current value. Either way, both versions stay in history."
      />
      {open.length === 0 ? (
        <EmptyState icon={GitPullRequestArrow} title="No open conflicts" description="Every source agrees with the archive right now." />
      ) : (
        <ul className="space-y-4">
          {open.map((c) => {
            const row = findRow(index.tables, c.entity_type, c.entity_id);
            const label = row ? describeRow(index.tables, c.entity_type, row) : "Removed record";
            const doc = c.source_document_id ? index.sourcesById.get(c.source_document_id) : null;
            const href = linkFor(c.entity_type, c.entity_id);
            return (
              <li key={c.id} className="space-y-3 rounded-xl border bg-card/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ENTITY_LABEL[c.entity_type]}</p>
                    <p className="font-semibold">
                      {href ? (
                        <Link href={href} className="hover:text-primary">
                          {label}
                        </Link>
                      ) : (
                        label
                      )}{" "}
                      · <code className="rounded bg-muted px-1 font-mono text-sm">{c.field}</code>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatTimestamp(c.created_at)}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                      On record <ProvenanceBadge provenance={c.current_provenance} />
                    </p>
                    <p className="break-words font-mono text-sm">{show(c.current_value)}</p>
                  </div>
                  <div className="rounded-lg border border-prov-conflicting/40 bg-prov-conflicting/5 p-3">
                    <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                      Proposed by {doc ? <span className="font-medium text-foreground">{doc.title}</span> : "an import"} <ProvenanceBadge provenance={c.proposed_provenance} />
                    </p>
                    <p className="break-words font-mono text-sm">{show(c.proposed_value)}</p>
                  </div>
                </div>
                {c.note && <p className="text-xs text-muted-foreground">{c.note}</p>}
                <div className="flex flex-wrap gap-3">
                  <ActionForm action={resolveConflictAction} fields={{ conflict_id: c.id, decision: "accept" }} label="Accept correction" variant="default" icon={<Check aria-hidden />} confirm="Apply the proposed value? The current value stays in the revision history.">
                    <label htmlFor={`note-a-${c.id}`} className="sr-only">
                      Note
                    </label>
                    <Input id={`note-a-${c.id}`} name="note" placeholder="Reason (optional)" className="h-8 w-56" />
                  </ActionForm>
                  <ActionForm action={resolveConflictAction} fields={{ conflict_id: c.id, decision: "reject" }} label="Keep current value" icon={<Undo2 aria-hidden />} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {resolved.length > 0 && (
        <section className="mt-10 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recently resolved</h2>
          <ul className="divide-y rounded-xl border bg-card/40 text-sm">
            {resolved.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <span>
                  <code className="font-mono text-xs">{c.field}</code> — {show(c.current_value)} vs {show(c.proposed_value)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {c.status === "accepted" ? "Correction accepted" : "Kept original"} · {c.resolved_by ?? "editor"} · {c.resolved_at ? formatTimestamp(c.resolved_at) : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
