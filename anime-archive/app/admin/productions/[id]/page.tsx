import { CalendarPlus, Download, ExternalLink, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createNextSeasonAction, deleteRecordAction, restoreRevisionAction } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { AdminHeader } from "@/components/admin/admin-header";
import { ChildSection, type ChildRow } from "@/components/admin/child-section";
import { EntityForm } from "@/components/admin/entity-form";
import { UrlTabs } from "@/components/anime/url-tabs";
import { IssueList } from "@/components/archive/issue-list";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { referenceOptions, sourceOptions } from "@/lib/admin/references";
import { formatDate, formatDateRange, formatTimestamp } from "@/lib/archive/dates";
import { rowToValues } from "@/lib/archive/forms";
import {
  BILLING_LABEL,
  BROADCAST_KIND_LABEL,
  CAST_TYPE_LABEL,
  COMPANY_ROLE_LABEL,
  CREDIT_ROLE_LABEL,
  LANGUAGE_LABEL,
  RELATION_LABEL,
  STUDIO_ROLE_LABEL,
  THEME_USAGE_LABEL,
} from "@/lib/archive/labels";
import { loadArchive } from "@/lib/archive/server";
import { analyzeBroadcastRun, validateProduction } from "@/lib/archive/validation";

export const metadata = { title: "Edit production" };

const asRow = (row: object) => row as Record<string, unknown>;

export default async function EditProductionPage({ params, searchParams }: PageProps<"/admin/productions/[id]">) {
  const { id } = await params;
  const { tab } = await searchParams;
  const index = await loadArchive();
  const production = index.productionsById.get(id);
  if (!production) notFound();

  const references = referenceOptions(index, id);
  const sources = sourceOptions(index);
  const fixed = { production_id: id };
  const runs = index.runsFor(id);
  const episodes = index.episodesFor(id);
  const issues = [...validateProduction(production, runs, episodes), ...runs.flatMap((r) => analyzeBroadcastRun(r).issues)];
  const revisions = index.revisions("production", id);
  const conflicts = index.conflicts("production", id).filter((c) => c.status === "open");

  const studioRows: ChildRow[] = index.studiosFor(id).map(({ link, studio }) => ({ id: link.id, title: studio.name, subtitle: STUDIO_ROLE_LABEL[link.role], provenance: link.provenance, row: asRow(link) }));
  const companyRows: ChildRow[] = index.companiesFor(id).map(({ link, company }) => ({
    id: link.id,
    title: company.name,
    subtitle: `${COMPANY_ROLE_LABEL[link.role]}${link.region ? ` · ${link.region}` : ""}`,
    provenance: link.provenance,
    row: asRow(link),
  }));
  const runRows: ChildRow[] = runs.map((r) => ({
    id: r.id,
    title: r.label ?? BROADCAST_KIND_LABEL[r.kind],
    subtitle: `${formatDateRange(r.start_date, r.end_date)} · ${LANGUAGE_LABEL[r.language] ?? r.language}${r.network_id ? ` · ${index.companiesById.get(r.network_id)?.name ?? ""}` : ""}`,
    provenance: r.provenance,
    row: asRow(r),
  }));
  const episodeRows: ChildRow[] = episodes.map((e) => ({ id: e.id, title: `Episode ${e.number}${e.title ? ` — ${e.title}` : ""}`, subtitle: e.title_native ?? undefined, provenance: e.provenance, row: asRow(e) }));
  const releaseRows: ChildRow[] = runs.flatMap((run) =>
    index.releasesForRun(run.id).map((r) => ({
      id: r.id,
      title: `Episode ${index.episodesById.get(r.episode_id)?.number ?? "?"} · ${formatDate(r.air_date, "short")}`,
      subtitle: run.label ?? BROADCAST_KIND_LABEL[run.kind],
      provenance: r.provenance,
      row: asRow(r),
    })),
  );
  const creditRows: ChildRow[] = index.creditsFor(id).map(({ credit, person }) => ({
    id: credit.id,
    title: `${CREDIT_ROLE_LABEL[credit.role]}: ${person.name}`,
    subtitle: credit.role_detail ?? undefined,
    provenance: credit.provenance,
    row: asRow(credit),
  }));
  const castRows: ChildRow[] = index.castFor(id).map(({ credit, person }) => ({
    id: credit.id,
    title: `${credit.character_name} — ${person.name}`,
    subtitle: [credit.language ? `${LANGUAGE_LABEL[credit.language]} cast` : "Featured performer", CAST_TYPE_LABEL[credit.credit_type], credit.billing && BILLING_LABEL[credit.billing]].filter(Boolean).join(" · "),
    provenance: credit.provenance,
    row: asRow(credit),
  }));
  const themeRows: ChildRow[] = index.themesFor(id).map(({ theme, track, credits }) => ({
    id: theme.id,
    title: `${THEME_USAGE_LABEL[theme.usage]}: “${track.title}”`,
    subtitle: credits.map((c) => c.person.name).join(", ") || undefined,
    provenance: theme.provenance,
    row: asRow(theme),
  }));
  const relatedRows: ChildRow[] = index
    .relatedFor(id)
    .filter((r) => !r.inverse)
    .map((r) => ({ id: r.link.id, title: `${RELATION_LABEL[r.relation]}: ${r.production.title}`, subtitle: r.link.notes ?? undefined, provenance: r.link.provenance, row: asRow(r.link) }));
  const inverseRelated = index.relatedFor(id).filter((r) => r.inverse);

  const tabs = [
    { value: "details", label: "Details" },
    { value: "companies", label: "Studios & companies", count: studioRows.length + companyRows.length },
    { value: "broadcast", label: "Broadcast & episodes", count: runRows.length },
    { value: "staff", label: "Staff", count: creditRows.length },
    { value: "cast", label: "Cast", count: castRows.length },
    { value: "music", label: "Music", count: themeRows.length },
    { value: "related", label: "Related", count: relatedRows.length + inverseRelated.length },
    { value: "history", label: "History", count: revisions.length },
  ];
  const initialTab = typeof tab === "string" ? tab : "details";

  return (
    <>
      <AdminHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {production.title} <ProvenanceBadge provenance={production.provenance} />
          </span>
        }
        description={production.title_native ?? undefined}
      >
        <Button asChild variant="outline" size="sm">
          <Link href={`/anime/${production.slug}`}>
            <ExternalLink aria-hidden /> View public page
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/export/production/${production.slug}`} download>
            <Download aria-hidden /> Export JSON
          </a>
        </Button>
        <ActionForm action={createNextSeasonAction} fields={{ production_id: id }} label="Create next season" icon={<CalendarPlus aria-hidden />} pendingLabel="Creating…" />
      </AdminHeader>

      {(issues.some((i) => i.level !== "info") || conflicts.length > 0) && (
        <div className="mb-6 space-y-2">
          {conflicts.length > 0 && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
              {conflicts.length} imported value{conflicts.length === 1 ? "" : "s"} disagree with this record.{" "}
              <Link href="/admin/conflicts" className="font-medium underline">
                Review conflicts
              </Link>
            </p>
          )}
          <IssueList issues={issues.filter((i) => i.level !== "info")} />
        </div>
      )}

      <UrlTabs key={initialTab} tabs={tabs} initial={initialTab}>
        <TabsContent value="details" className="space-y-6">
          <EntityForm
            entity="production"
            id={id}
            values={rowToValues("production", asRow(production))}
            references={references}
            sources={sources}
            warning={production.provenance === "confirmed" ? "This record is Confirmed. Your changes are logged and the previous values stay in the revision history." : undefined}
          />
          <div className="rounded-xl border border-destructive/30 p-4">
            <h2 className="text-sm font-semibold">Remove this production</h2>
            <p className="mb-3 text-sm text-muted-foreground">Removes the production with its credits, broadcast runs and links. Everything can be brought back from the revision history.</p>
            <ActionForm
              action={deleteRecordAction}
              fields={{ __entity: "production", __id: id, __redirect: "/admin/productions" }}
              label="Delete production"
              variant="destructive"
              icon={<Trash2 aria-hidden />}
              confirm={`Delete “${production.title}” and its linked records?`}
            />
          </div>
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          <ChildSection entity="production_studio" title="Animation studios" rows={studioRows} fixed={fixed} references={references} sources={sources} addLabel="Assign a studio" emptyText="No studio assigned yet." defaults={{ role: "animation" }} />
          <ChildSection
            entity="production_company"
            title="Production companies, licensors & distributors"
            rows={companyRows}
            fixed={fixed}
            references={references}
            sources={sources}
            addLabel="Add a company"
            emptyText="No companies recorded yet."
            defaults={{ role: "production_committee" }}
          />
          <p className="text-sm text-muted-foreground">
            Need a studio or company that isn&apos;t listed?{" "}
            <Link href="/admin/records/studio/new" className="text-primary underline">
              Register a studio
            </Link>{" "}
            or{" "}
            <Link href="/admin/records/company/new" className="text-primary underline">
              add a company
            </Link>
            .
          </p>
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-6">
          <ChildSection
            entity="broadcast_run"
            title="Broadcast runs"
            description="Keep each schedule separate: Japanese TV, advance broadcasts, streaming, English dubs, theatrical and home-video releases."
            rows={runRows}
            fixed={fixed}
            references={references}
            sources={sources}
            addLabel="Add a broadcast run"
            emptyText="No broadcast schedule recorded yet."
            defaults={{ kind: production.format === "film" ? "theatrical" : "tv", cadence: production.format === "film" ? "single" : "weekly", language: "ja", time_zone: "Asia/Tokyo" }}
          />
          <ChildSection entity="episode" title="Episodes" rows={episodeRows} fixed={fixed} references={references} sources={sources} addLabel="Add an episode" emptyText="No episodes recorded yet." />
          <ChildSection
            entity="episode_release"
            title="Episode air dates"
            description="One episode can carry a date for every run — Japanese broadcast, advance broadcast, dub and regional releases."
            rows={releaseRows}
            fixed={{}}
            references={references}
            sources={sources}
            addLabel="Add an air date"
            emptyText={episodes.length === 0 ? "Add episodes first, then record their air dates per broadcast run." : "No individual air dates recorded yet."}
          />
        </TabsContent>

        <TabsContent value="staff">
          <ChildSection
            entity="production_credit"
            title="Staff credits"
            description="Directors, writers, designers, composers and the rest of the creative team."
            rows={creditRows}
            fixed={fixed}
            references={references}
            sources={sources}
            addLabel="Add a staff credit"
            emptyText="No staff credited yet."
            defaults={{ role: "director", sort_order: "0" }}
          />
          <p className="mt-3 text-sm text-muted-foreground">
            Someone missing?{" "}
            <Link href="/admin/records/person/new" className="text-primary underline">
              Register a person
            </Link>{" "}
            and they&apos;ll appear in the list.
          </p>
        </TabsContent>

        <TabsContent value="cast">
          <ChildSection
            entity="voice_credit"
            title="Voice cast & performers"
            rows={castRows}
            fixed={fixed}
            references={references}
            sources={sources}
            addLabel="Add a cast member"
            emptyText="No cast recorded yet."
            defaults={{ language: "ja", credit_type: "voice" }}
          />
        </TabsContent>

        <TabsContent value="music">
          <ChildSection
            entity="theme_song"
            title="Theme songs & soundtrack"
            description="Assign openings, endings, insert songs and soundtrack releases. Composers of the score are staff credits with the Music role."
            rows={themeRows}
            fixed={fixed}
            references={references}
            sources={sources}
            addLabel="Assign a track"
            emptyText="No music assigned yet."
            defaults={{ usage: "opening", sequence: "1" }}
          />
          <p className="mt-3 text-sm text-muted-foreground">
            New song?{" "}
            <Link href="/admin/records/music_track/new" className="text-primary underline">
              Add the track
            </Link>{" "}
            first, then assign it here.
          </p>
        </TabsContent>

        <TabsContent value="related" className="space-y-6">
          <ChildSection
            entity="related_media"
            title="Related productions"
            description="Sequels, films, OVAs, ONAs and specials connected to this production."
            rows={relatedRows}
            fixed={fixed}
            references={references}
            sources={sources}
            addLabel="Link a production"
            emptyText="No related productions linked from here."
            defaults={{ relation: "sequel" }}
          />
          {inverseRelated.length > 0 && (
            <div className="rounded-xl border bg-card/40 p-5 text-sm">
              <h2 className="mb-2 font-semibold">Linked from other productions</h2>
              <ul className="space-y-1 text-muted-foreground">
                {inverseRelated.map((r) => (
                  <li key={r.link.id}>
                    {RELATION_LABEL[r.relation]}:{" "}
                    <Link href={`/admin/productions/${r.production.id}?tab=related`} className="text-foreground underline">
                      {r.production.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <ol className="space-y-3">
            {revisions.map((r) => (
              <li key={r.id} className="rounded-xl border bg-card/40 p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{r.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(r.created_at)} · {r.action}
                      {r.author ? ` · ${r.author}` : ""}
                    </p>
                  </div>
                  {r.after && r.action !== "delete" && (
                    <ActionForm action={restoreRevisionAction} fields={{ revision_id: r.id }} label="Restore this version" icon={<RotateCcw aria-hidden />} confirm="Restore the production to this version?" />
                  )}
                </div>
                {r.changed_fields.length > 0 && r.before && r.after && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-primary">Show changes</summary>
                    <dl className="mt-2 space-y-1 font-mono text-xs">
                      {r.changed_fields.map((f) => (
                        <div key={f} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                          <dt className="text-muted-foreground">{f}</dt>
                          <dd>
                            <span className="text-destructive line-through">{JSON.stringify(r.before![f] ?? null)}</span> → <span className="text-prov-confirmed">{JSON.stringify(r.after![f] ?? null)}</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                )}
              </li>
            ))}
          </ol>
        </TabsContent>
      </UrlTabs>
    </>
  );
}
