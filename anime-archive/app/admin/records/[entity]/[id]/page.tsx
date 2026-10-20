import { ExternalLink, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteRecordAction } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { AdminHeader } from "@/components/admin/admin-header";
import { ChildSection } from "@/components/admin/child-section";
import { EntityForm } from "@/components/admin/entity-form";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { Button } from "@/components/ui/button";
import { referenceOptions, sourceOptions } from "@/lib/admin/references";
import { isRecordEntity, RECORD_COPY, recordRow } from "@/lib/admin/records";
import { formatTimestamp } from "@/lib/archive/dates";
import { rowToValues } from "@/lib/archive/forms";
import { FORMAT_SHORT, TRACK_ROLE_LABEL } from "@/lib/archive/labels";
import { blockingReferences } from "@/lib/archive/mutations";
import { loadArchive } from "@/lib/archive/server";
import type { Provenance } from "@/lib/archive/types";

export default async function EditRecordPage({ params }: PageProps<"/admin/records/[entity]/[id]">) {
  const { entity, id } = await params;
  if (!isRecordEntity(entity)) notFound();
  const index = await loadArchive();
  const row = recordRow(index, entity, id);
  if (!row) notFound();
  const copy = RECORD_COPY[entity];
  const references = referenceOptions(index);
  const sources = sourceOptions(index);
  const title = String(row.title ?? row.name);
  const blockers = blockingReferences(index.tables, entity, id);
  const revisions = index.revisions(entity, id);
  const publicHref = copy.publicPath && row.slug ? `${copy.publicPath}/${row.slug}` : null;

  return (
    <>
      <AdminHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {title} <ProvenanceBadge provenance={row.provenance as Provenance} />
          </span>
        }
        description={copy.description}
      >
        {publicHref && (
          <Button asChild variant="outline" size="sm">
            <Link href={publicHref}>
              <ExternalLink aria-hidden /> View public page
            </Link>
          </Button>
        )}
      </AdminHeader>

      <div className="space-y-8">
        <EntityForm
          entity={entity}
          id={id}
          values={rowToValues(entity, row)}
          references={references}
          sources={entity === "source_document" ? [] : sources}
          warning={row.provenance === "confirmed" && entity !== "source_document" ? "This record is Confirmed. Changes are logged with the previous values kept in history." : undefined}
        />

        {entity === "music_track" && (
          <ChildSection
            entity="track_credit"
            title="Performers & composers"
            rows={index.trackCredits(id).map(({ credit, person }) => ({
              id: credit.id,
              title: `${TRACK_ROLE_LABEL[credit.role]}: ${person.name}`,
              subtitle: credit.credited_as ? `Credited as ${credit.credited_as}` : undefined,
              provenance: credit.provenance,
              row: credit as unknown as Record<string, unknown>,
            }))}
            fixed={{ track_id: id }}
            references={references}
            sources={sources}
            addLabel="Add a credit"
            emptyText="No performers or composers credited yet."
            defaults={{ role: "performer" }}
          />
        )}

        {entity === "franchise" && (
          <section className="space-y-3 rounded-xl border bg-card/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Entries</h2>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/productions/new?franchise=${id}`}>
                  <Plus aria-hidden /> Add an entry
                </Link>
              </Button>
            </div>
            <ol className="divide-y rounded-lg border">
              {index.franchiseEntries(id).map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <Link href={`/admin/productions/${p.id}`} className="font-medium hover:text-primary">
                    {p.franchise_order ?? "–"}. {p.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {FORMAT_SHORT[p.format]} · {p.premiere_year ?? "year pending"}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="rounded-xl border border-destructive/30 p-4">
          <h2 className="text-sm font-semibold">Remove this {copy.singular}</h2>
          {blockers.length ? (
            <p className="mt-1 text-sm text-muted-foreground">Still used by {blockers.join(", ")}. Reassign or remove those first so no credit is left without its record.</p>
          ) : (
            <ActionForm
              action={deleteRecordAction}
              fields={{ __entity: entity, __id: id, __redirect: `/admin/records/${entity}` }}
              label={`Delete ${copy.singular}`}
              variant="destructive"
              icon={<Trash2 aria-hidden />}
              confirm={`Delete “${title}”? You can restore it from the revision history.`}
              className="mt-3"
            />
          )}
        </section>

        {revisions.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">History</h2>
            <ul className="divide-y rounded-xl border bg-card/40 text-sm">
              {revisions.map((r) => (
                <li key={r.id} className="px-4 py-2.5">
                  <p className="font-medium">{r.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(r.created_at)}
                    {r.author ? ` · ${r.author}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
