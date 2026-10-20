import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { restoreRevisionAction } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { AdminHeader } from "@/components/admin/admin-header";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { formatTimestamp } from "@/lib/archive/dates";
import { ENTITY_LABEL } from "@/lib/archive/labels";
import { findRow } from "@/lib/archive/mutations";
import { loadArchive } from "@/lib/archive/server";
import { ENTITY_TYPES, REVISION_ACTIONS } from "@/lib/archive/types";

export const metadata = { title: "Revisions" };

const PAGE = 40;

export default async function RevisionsPage({ searchParams }: PageProps<"/admin/revisions">) {
  const params = await searchParams;
  const entity = typeof params.entity === "string" ? params.entity : "";
  const action = typeof params.action === "string" ? params.action : "";
  const page = Math.max(1, Number(params.page) || 1);
  const index = await loadArchive();

  const all = [...index.tables.revisions]
    .filter((r) => (!entity || r.entity_type === entity) && (!action || r.action === action))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
  const rows = all.slice((page - 1) * PAGE, page * PAGE);
  const pages = Math.max(1, Math.ceil(all.length / PAGE));
  const batchSizes = new Map<string, number>();
  for (const r of index.tables.revisions) if (r.action === "delete") batchSizes.set(r.batch_id, (batchSizes.get(r.batch_id) ?? 0) + 1);

  const query = (p: number) => `?${new URLSearchParams({ ...(entity && { entity }), ...(action && { action }), page: String(p) })}`;

  return (
    <>
      <AdminHeader title="Revision history" description="Every create, update, import, deletion and correction. Restore any earlier version, or bring back everything removed in one go." />
      <form className="mb-5 flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="rev-entity" className="text-xs text-muted-foreground">
            Record type
          </label>
          <NativeSelect id="rev-entity" name="entity" defaultValue={entity} className="w-52">
            <option value="">All record types</option>
            {ENTITY_TYPES.map((e) => (
              <option key={e} value={e}>
                {ENTITY_LABEL[e]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="rev-action" className="text-xs text-muted-foreground">
            Action
          </label>
          <NativeSelect id="rev-action" name="action" defaultValue={action} className="w-40">
            <option value="">All actions</option>
            {REVISION_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <ol className="space-y-3">
        {rows.map((r) => {
          const exists = !!findRow(index.tables, r.entity_type, r.entity_id);
          const batch = batchSizes.get(r.batch_id) ?? 0;
          return (
            <li key={r.id} className="rounded-xl border bg-card/40 p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{r.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {ENTITY_LABEL[r.entity_type]} · {r.action} · {formatTimestamp(r.created_at)}
                    {r.author ? ` · ${r.author}` : ""}
                    {!exists && " · record currently removed"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.action === "delete" && !exists && batch > 1 && (
                    <ActionForm action={restoreRevisionAction} fields={{ batch_id: r.batch_id }} label={`Restore all ${batch}`} icon={<RotateCcw aria-hidden />} confirm={`Restore all ${batch} records removed together?`} />
                  )}
                  {((r.action === "delete" && !exists) || (r.action !== "delete" && r.after)) && (
                    <ActionForm
                      action={restoreRevisionAction}
                      fields={{ revision_id: r.id }}
                      label={r.action === "delete" ? "Restore" : "Restore this version"}
                      icon={<RotateCcw aria-hidden />}
                      confirm="Restore this version?"
                    />
                  )}
                </div>
              </div>
              {r.changed_fields.length > 0 && r.before && r.after && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-primary">Show changes ({r.changed_fields.length})</summary>
                  <dl className="mt-2 space-y-1 font-mono text-xs">
                    {r.changed_fields.map((f) => (
                      <div key={f} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                        <dt className="text-muted-foreground">{f}</dt>
                        <dd className="break-words">
                          <span className="text-destructive line-through">{JSON.stringify(r.before![f] ?? null)}</span> →{" "}
                          <span className="text-prov-confirmed">{JSON.stringify(r.after![f] ?? null)}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
            </li>
          );
        })}
      </ol>
      <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Page {page} of {pages} · {all.length} revisions
        </span>
        <span className="flex gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={query(page - 1)}>Newer</Link>
            </Button>
          )}
          {page < pages && (
            <Button asChild variant="outline" size="sm">
              <Link href={query(page + 1)}>Older</Link>
            </Button>
          )}
        </span>
      </nav>
    </>
  );
}
