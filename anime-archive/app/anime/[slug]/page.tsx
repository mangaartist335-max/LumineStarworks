import { Download, ExternalLink, FileText, History, PenLine, Star, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BroadcastSection } from "@/components/anime/broadcast-section";
import { InfoList, Panel, Pending } from "@/components/anime/info-list";
import { UrlTabs } from "@/components/anime/url-tabs";
import { IssueList } from "@/components/archive/issue-list";
import { PosterArt } from "@/components/archive/poster-art";
import { ProductionCard, broadcastLine } from "@/components/archive/production-card";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { StatusBadge } from "@/components/archive/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { getViewer } from "@/lib/auth";
import { formatDate, formatTimestamp } from "@/lib/archive/dates";
import {
  AGE_RATING_LABEL,
  BILLING_LABEL,
  CAST_TYPE_LABEL,
  COMPANY_ROLE_LABEL,
  CREDIT_ROLE_LABEL,
  DEMOGRAPHIC_LABEL,
  FORMAT_LABEL,
  PROVENANCE_DESCRIPTION,
  PROVENANCE_LABEL,
  RELATION_LABEL,
  SOURCE_DOCUMENT_KIND_LABEL,
  SOURCE_LABEL,
  STUDIO_ROLE_LABEL,
  THEME_USAGE_LABEL,
  TRACK_KIND_LABEL,
} from "@/lib/archive/labels";
import { getProductionDetail, type ProductionDetail } from "@/lib/archive/queries";
import { formatSeason, seasonHref } from "@/lib/archive/seasons";
import { archiveToday, loadArchive } from "@/lib/archive/server";
import type { CreditRole } from "@/lib/archive/types";

export async function generateMetadata({ params }: PageProps<"/anime/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const index = await loadArchive();
  const p = index.productionsBySlug.get(slug);
  if (!p) return { title: "Production not found" };
  return {
    title: p.title,
    description: p.synopsis ?? `${FORMAT_LABEL[p.format]}${p.premiere_year ? ` from ${p.premiere_year}` : ""} in the Lumine StarWorks Anime Archive.`,
  };
}

/** Roles every production page lists, even before they're documented. */
const CORE_ROLES: CreditRole[] = [
  "director",
  "assistant_director",
  "series_composition",
  "screenplay",
  "character_design",
  "animation_director",
  "art_director",
  "color_design",
  "director_of_photography",
  "sound_director",
  "music",
];

function PersonLinks({ people }: { people: { slug: string; name: string; role_detail?: string | null }[] }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {people.map((p) => (
        <Link key={p.slug} href={`/staff/${p.slug}`} className="font-medium hover:text-primary hover:underline">
          {p.name}
          {p.role_detail && <span className="ml-1 text-xs font-normal text-muted-foreground">({p.role_detail})</span>}
        </Link>
      ))}
    </span>
  );
}

function valueText(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.join(", ") || "—";
  return String(value);
}

export default async function ProductionPage({ params, searchParams }: PageProps<"/anime/[slug]">) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const [index, viewer] = await Promise.all([loadArchive(), getViewer()]);
  const today = archiveToday();
  const detail = getProductionDetail(index, slug, today);
  if (!detail) notFound();

  const { production: p, summary } = detail;
  const credits = detail.departments.flatMap((d) => d.roles);
  const creditFor = (role: CreditRole) => credits.find((r) => r.role === role)?.people ?? [];
  const errors = detail.issues.filter((i) => i.level === "error").length;
  const warnings = detail.issues.filter((i) => i.level === "warning").length;
  const openConflicts = detail.conflicts.filter((c) => c.status === "open");
  const networks = [...new Set(detail.runs.map((r) => r.network).filter((n): n is string => !!n))];
  const castCount = detail.cast.ja.length + detail.cast.en.length + detail.cast.other.length;
  const broadcast = broadcastLine(summary);

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "broadcast", label: "Broadcast", count: detail.runs.length },
    { value: "staff", label: "Staff", count: credits.reduce((n, r) => n + r.people.length, 0) },
    { value: "cast", label: "Cast", count: castCount },
    { value: "music", label: "Music", count: detail.themes.length },
    { value: "companies", label: "Companies", count: detail.studios.length + detail.companies.length },
    { value: "related", label: "Related", count: detail.related.length + Math.max(0, detail.franchiseEntries.length - 1) },
    { value: "history", label: "History & reception" },
    { value: "sources", label: "Sources & revisions", count: detail.revisions.length },
  ];

  return (
    <article>
      {/* Header */}
      <header className="relative overflow-hidden border-b">
        <div aria-hidden className="absolute inset-0 scale-125 opacity-35 blur-3xl saturate-150">
          <PosterArt slug={p.slug} title="" format={p.format} className="h-full rounded-none" />
        </div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/75 to-background" />
        <div className="container-page relative grid gap-8 py-10 md:grid-cols-[13rem_1fr] md:py-12">
          <div className="mx-auto w-44 md:w-full">
            <PosterArt
              slug={p.slug}
              title={p.title}
              native={p.title_native}
              format={p.format}
              year={summary.premiere_year}
              provenance={p.provenance}
              posterUrl={p.poster_url}
              size="lg"
              className="shadow-2xl"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/anime" className="hover:text-foreground">
                Anime
              </Link>
              {detail.franchise && (
                <>
                  <span aria-hidden>/</span>
                  <Link href={`/franchises/${detail.franchise.slug}`} className="hover:text-foreground">
                    {detail.franchise.name}
                  </Link>
                </>
              )}
              {summary.premiere && (
                <>
                  <span aria-hidden>/</span>
                  <Link href={seasonHref(summary.premiere)} className="hover:text-foreground">
                    {formatSeason(summary.premiere)}
                  </Link>
                </>
              )}
            </nav>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{p.title}</h1>
              {(p.title_native || p.title_romaji) && (
                <p className="mt-1.5 font-jp text-lg text-muted-foreground">
                  {p.title_native}
                  {p.title_native && p.title_romaji && <span className="mx-2 opacity-50">·</span>}
                  <span className="font-sans text-base">{p.title_romaji}</span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{FORMAT_LABEL[p.format]}</Badge>
              <StatusBadge status={summary.status} />
              <ProvenanceBadge provenance={p.provenance} />
              {summary.cours > 1 && <Badge variant="outline">{summary.cours} cours</Badge>}
              {openConflicts.length > 0 && (
                <Badge variant="destructive">
                  <TriangleAlert aria-hidden /> {openConflicts.length} open conflict{openConflicts.length === 1 ? "" : "s"}
                </Badge>
              )}
              {p.score !== null && (
                <span className="inline-flex items-center gap-1 rounded-md bg-star/12 px-2 py-0.5 font-mono text-sm font-semibold text-star">
                  <Star aria-hidden className="size-3.5 fill-current" /> {p.score.toFixed(2)}
                </span>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-5">
              <div>
                <dt className="text-xs text-muted-foreground">Studio</dt>
                <dd className="font-medium">
                  {detail.studios.length ? (
                    detail.studios.map(({ studio }, i) => (
                      <span key={studio.id}>
                        {i > 0 && ", "}
                        <Link href={`/studios/${studio.slug}`} className="hover:text-primary hover:underline">
                          {studio.name}
                        </Link>
                      </span>
                    ))
                  ) : (
                    <Pending />
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Episodes</dt>
                <dd className="font-medium">{p.episode_count ?? <Pending>Pending</Pending>}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{p.format === "film" ? "Released" : "Aired"}</dt>
                <dd className="font-medium tabular-nums">
                  {p.premiere_date ? formatDate(p.premiere_date, "short") : (p.premiere_year ?? <Pending>Pending</Pending>)}
                  {p.finale_date && p.finale_date !== p.premiere_date && ` – ${formatDate(p.finale_date, "short")}`}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Premiere season</dt>
                <dd className="font-medium">
                  {summary.premiere ? (
                    <Link href={seasonHref(summary.premiere)} className="hover:text-primary hover:underline">
                      {formatSeason(summary.premiere)}
                    </Link>
                  ) : (
                    <Pending>Pending</Pending>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Broadcast</dt>
                <dd className="font-medium">{broadcast ?? <Pending>Pending</Pending>}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              {viewer.canEdit && (
                <Button asChild size="sm">
                  <Link href={`/admin/productions/${p.id}`}>
                    <PenLine aria-hidden /> Edit record
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" variant="outline">
                <a href={`/api/export/production/${p.slug}`} download>
                  <Download aria-hidden /> Export JSON
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-page py-8">
        <UrlTabs key={typeof tab === "string" ? tab : "overview"} tabs={tabs} initial={typeof tab === "string" ? tab : "overview"}>
          {/* Overview */}
          <TabsContent value="overview" className="grid gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-8">
              <Panel title="Synopsis">
                {p.synopsis ? <p className="max-w-3xl leading-relaxed text-foreground/90">{p.synopsis}</p> : <Pending>A synopsis hasn&apos;t been documented yet.</Pending>}
              </Panel>
              <Panel title="Information">
                <InfoList
                  items={[
                    { label: "English title", value: p.title },
                    { label: "Japanese title", value: p.title_native && <span className="font-jp">{p.title_native}</span> },
                    { label: "Romanization", value: p.title_romaji },
                    { label: "Alternative titles", value: p.alt_titles.join(" · ") },
                    { label: "Format", value: FORMAT_LABEL[p.format] },
                    { label: "Source material", value: p.source_material && SOURCE_LABEL[p.source_material] },
                    { label: "Demographic", value: p.demographic && DEMOGRAPHIC_LABEL[p.demographic] },
                    { label: "Age rating", value: p.age_rating && AGE_RATING_LABEL[p.age_rating] },
                    { label: "Premiere season", value: summary.premiere && formatSeason(summary.premiere) },
                    { label: "Premiere date", value: p.premiere_date && formatDate(p.premiere_date) },
                    { label: p.format === "film" ? "Final screening" : "Finale date", value: p.finale_date && formatDate(p.finale_date) },
                    { label: "Episodes", value: p.episode_count },
                    { label: "Runtime", value: p.runtime_minutes && `${p.runtime_minutes} min${p.format === "film" ? "" : " per episode"}` },
                    { label: "Broadcast networks", value: networks.join(", ") },
                    { label: "Season in franchise", value: p.season_number && detail.franchise ? `Season ${p.season_number} of ${detail.franchise.name}` : null },
                  ]}
                />
              </Panel>
              <Panel title="Genres & themes">
                {p.genres.length + p.themes.length === 0 ? (
                  <Pending />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {p.genres.map((g) => (
                      <Link key={g} href={`/anime?genre=${encodeURIComponent(g)}`} className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground hover:bg-primary hover:text-primary-foreground">
                        {g}
                      </Link>
                    ))}
                    {p.themes.map((t) => (
                      <span key={t} className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Panel>
              {p.notes && (
                <Panel title="Archive notes">
                  <p className="rounded-xl border bg-card/50 p-4 text-sm leading-relaxed text-muted-foreground">{p.notes}</p>
                </Panel>
              )}
            </div>
            <aside className="space-y-6">
              <div className="space-y-3 rounded-xl border bg-card/50 p-4">
                <h3 className="text-sm font-semibold">Record status</h3>
                <ProvenanceBadge provenance={p.provenance} />
                <p className="text-sm text-muted-foreground">{PROVENANCE_DESCRIPTION[p.provenance]}</p>
                <p className="text-xs text-muted-foreground">
                  Cited by {detail.sources.length} source document{detail.sources.length === 1 ? "" : "s"} · {detail.revisions.length} revision
                  {detail.revisions.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="space-y-3 rounded-xl border bg-card/50 p-4">
                <h3 className="text-sm font-semibold">Key staff</h3>
                {detail.keyStaff.length === 0 ? (
                  <Pending>Staff credits haven&apos;t been documented yet.</Pending>
                ) : (
                  <dl className="space-y-2 text-sm">
                    {detail.keyStaff.map(({ role, people }) => (
                      <div key={role}>
                        <dt className="text-xs text-muted-foreground">{CREDIT_ROLE_LABEL[role]}</dt>
                        <dd>
                          <PersonLinks people={people} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
              <div className="space-y-3 rounded-xl border bg-card/50 p-4">
                <h3 className="text-sm font-semibold">Timeline check</h3>
                <p className="text-sm text-muted-foreground">
                  {errors + warnings === 0
                    ? "Dates, weekdays and episode counts line up."
                    : `${errors} issue${errors === 1 ? "" : "s"} and ${warnings} item${warnings === 1 ? "" : "s"} to review.`}
                </p>
                <Link href="?tab=broadcast" className="text-sm font-medium text-primary hover:underline">
                  See broadcast details
                </Link>
              </div>
            </aside>
          </TabsContent>

          {/* Broadcast */}
          <TabsContent value="broadcast">
            <BroadcastSection detail={detail} />
            {detail.issues.some((i) => i.entity_type === "production") && (
              <Panel title="Production timeline checks" className="mt-8">
                <IssueList issues={detail.issues.filter((i) => i.entity_type === "production")} />
              </Panel>
            )}
          </TabsContent>

          {/* Staff */}
          <TabsContent value="staff" className="space-y-8">
            <Panel title="Core creative team">
              <InfoList
                items={CORE_ROLES.map((role) => {
                  const people = creditFor(role);
                  return { label: CREDIT_ROLE_LABEL[role], value: people.length ? <PersonLinks people={people} /> : null };
                })}
              />
            </Panel>
            {detail.departments.map((dept) => {
              const extra = dept.roles.filter((r) => !CORE_ROLES.includes(r.role));
              if (extra.length === 0) return null;
              return (
                <Panel key={dept.label} title={`${dept.label} — additional credits`}>
                  <InfoList items={extra.map((r) => ({ label: CREDIT_ROLE_LABEL[r.role], value: <PersonLinks people={r.people} /> }))} />
                </Panel>
              );
            })}
          </TabsContent>

          {/* Cast */}
          <TabsContent value="cast" className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <CastTable title="Japanese cast" rows={detail.cast.ja} />
              <CastTable title="English cast" rows={detail.cast.en} />
            </div>
            {detail.cast.other.length > 0 && <CastTable title="Featured performers" rows={detail.cast.other} />}
          </TabsContent>

          {/* Music */}
          <TabsContent value="music" className="space-y-8">
            <Panel title="Music composers">
              {creditFor("music").length ? <PersonLinks people={creditFor("music")} /> : <Pending />}
            </Panel>
            <Panel title="Theme songs, insert songs & soundtrack">
              {detail.themes.length === 0 ? (
                <Pending>No theme songs or soundtrack releases have been documented yet.</Pending>
              ) : (
                <ul className="grid gap-3 md:grid-cols-2">
                  {detail.themes.map(({ theme, track, performers, composers, label }) => (
                    <li key={theme.id} className="rounded-xl border bg-card/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {THEME_USAGE_LABEL[theme.usage]}
                        {theme.sequence && theme.usage !== "soundtrack" ? ` ${theme.sequence}` : ""}
                        {theme.episodes ? ` · Episodes ${theme.episodes}` : ""}
                      </p>
                      <p className="mt-1 font-semibold">“{track.title}”</p>
                      {track.title_native && <p className="font-jp text-xs text-muted-foreground">{track.title_native}</p>}
                      <p className="mt-1 text-sm text-muted-foreground">
                        {performers.length > 0 && (
                          <>
                            by <PersonInline people={performers} />
                          </>
                        )}
                        {composers.length > 0 && (
                          <>
                            Composed by <PersonInline people={composers} />
                          </>
                        )}
                        {performers.length + composers.length === 0 && "Performer not yet documented"}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {TRACK_KIND_LABEL[track.kind]}
                        {track.release_date ? ` · Released ${formatDate(track.release_date, "short")}` : track.release_year ? ` · ${track.release_year}` : ""}
                        {label ? ` · ${label}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </TabsContent>

          {/* Companies */}
          <TabsContent value="companies" className="grid gap-8 lg:grid-cols-2">
            <Panel title="Animation studios">
              {detail.studios.length === 0 ? (
                <Pending />
              ) : (
                <ul className="space-y-2">
                  {detail.studios.map(({ studio, link }) => (
                    <li key={link.id} className="flex items-center justify-between rounded-lg border bg-card/50 px-4 py-2.5 text-sm">
                      <Link href={`/studios/${studio.slug}`} className="font-medium hover:text-primary">
                        {studio.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">{STUDIO_ROLE_LABEL[link.role]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Broadcast networks & platforms">
              {networks.length === 0 ? (
                <Pending />
              ) : (
                <ul className="space-y-2">
                  {detail.runs
                    .filter((r) => r.network)
                    .map(({ run, network }) => (
                      <li key={run.id} className="flex items-center justify-between rounded-lg border bg-card/50 px-4 py-2.5 text-sm">
                        <span className="font-medium">{network}</span>
                        <span className="text-xs text-muted-foreground">{run.label ?? run.kind}</span>
                      </li>
                    ))}
                </ul>
              )}
            </Panel>
            <Panel title="Production committee">
              <CompanyList rows={detail.companies.filter((c) => c.link.role === "production_committee" || c.link.role === "producer" || c.link.role === "music")} />
            </Panel>
            <Panel title="Licensors & distributors">
              <CompanyList rows={detail.companies.filter((c) => c.link.role === "licensor" || c.link.role === "distributor" || c.link.role === "streaming")} />
            </Panel>
          </TabsContent>

          {/* Related */}
          <TabsContent value="related" className="space-y-10">
            {detail.franchise && (
              <Panel
                title={`${detail.franchise.name} franchise`}
                action={
                  <Link href={`/franchises/${detail.franchise.slug}`} className="text-sm font-medium text-primary hover:underline">
                    Full timeline
                  </Link>
                }
              >
                <ol className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {detail.franchiseEntries.map((entry) => (
                    <li key={entry.id} className={entry.id === p.id ? "rounded-xl ring-2 ring-primary ring-offset-4 ring-offset-background" : undefined}>
                      <ProductionCard production={entry} showSeason />
                    </li>
                  ))}
                </ol>
              </Panel>
            )}
            <Panel title="Sequels, prequels, films, OVAs & specials">
              {detail.related.length === 0 ? (
                <Pending>No related productions have been linked yet.</Pending>
              ) : (
                <ul className="grid gap-3 md:grid-cols-2">
                  {detail.related.map((r) => (
                    <li key={r.link.id}>
                      <Link href={`/anime/${r.production.slug}`} className="flex items-center gap-4 rounded-xl border bg-card/50 p-3 hover:border-primary/40">
                        <div className="w-14 shrink-0">
                          <PosterArt slug={r.production.slug} title={r.production.title} format={r.production.format} size="sm" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{RELATION_LABEL[r.relation]}</p>
                          <p className="truncate font-semibold">{r.production.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {FORMAT_LABEL[r.production.format]} · {r.summary.premiere ? formatSeason(r.summary.premiere) : (r.production.premiere_year ?? "Date pending")}
                          </p>
                          {r.link.notes && <p className="mt-1 text-xs text-muted-foreground">{r.link.notes}</p>}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="grid gap-8 lg:grid-cols-2">
            <Panel title="Production history">
              {p.production_history ? <p className="leading-relaxed text-foreground/90">{p.production_history}</p> : <Pending>No production history has been documented yet.</Pending>}
            </Panel>
            <Panel title="Reception & popularity">
              <div className="space-y-4 rounded-xl border bg-card/50 p-4">
                {p.score !== null ? (
                  <div>
                    <p className="text-xs text-muted-foreground">Archive score</p>
                    <p className="flex items-baseline gap-2">
                      <span className="font-mono text-3xl font-bold">{p.score.toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground">/ 10</span>
                    </p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Score ${p.score} out of 10`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-star" style={{ width: `${p.score * 10}%` }} />
                    </div>
                    {p.provenance === "proposed" && <p className="mt-2 text-xs text-muted-foreground">Sample score on a Proposed entry.</p>}
                  </div>
                ) : (
                  <Pending>No reception data has been documented yet.</Pending>
                )}
                {p.reception && <p className="text-sm leading-relaxed">{p.reception}</p>}
              </div>
            </Panel>
            <Panel title="Official releases">
              <ul className="space-y-2 text-sm">
                {detail.runs.map(({ run, network }) => (
                  <li key={run.id} className="flex flex-wrap justify-between gap-2 rounded-lg border bg-card/50 px-4 py-2.5">
                    <span className="font-medium">{run.label ?? run.kind}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {run.start_date ? formatDate(run.start_date, "short") : "Date pending"}
                      {network ? ` · ${network}` : ""}
                    </span>
                  </li>
                ))}
                {detail.runs.length === 0 && <Pending />}
              </ul>
            </Panel>
          </TabsContent>

          {/* Sources */}
          <TabsContent value="sources" className="space-y-8">
            <SourcesSection detail={detail} />
          </TabsContent>
        </UrlTabs>
      </div>
    </article>
  );
}

function PersonInline({ people }: { people: { slug: string; name: string }[] }) {
  return (
    <>
      {people.map((p, i) => (
        <span key={p.slug}>
          {i > 0 && ", "}
          <Link href={`/staff/${p.slug}`} className="font-medium text-foreground hover:text-primary hover:underline">
            {p.name}
          </Link>
        </span>
      ))}
    </>
  );
}

function CastTable({ title, rows }: { title: string; rows: ProductionDetail["cast"]["ja"] }) {
  return (
    <Panel title={title}>
      {rows.length === 0 ? (
        <Pending>No {title.toLowerCase()} has been documented yet.</Pending>
      ) : (
        <ul className="divide-y rounded-xl border bg-card/50">
          {rows.map((c) => (
            <li key={c.id} className="grid grid-cols-[1fr_1fr] gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{c.character_name}</p>
                {c.character_name_native && <p className="font-jp text-xs text-muted-foreground">{c.character_name_native}</p>}
                <p className="text-xs text-muted-foreground">
                  {[c.billing && BILLING_LABEL[c.billing], c.credit_type !== "voice" && CAST_TYPE_LABEL[c.credit_type]].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <Link href={`/staff/${c.person.slug}`} className="font-medium hover:text-primary hover:underline">
                  {c.person.name}
                </Link>
                {c.person.name_native && <p className="font-jp text-xs text-muted-foreground">{c.person.name_native}</p>}
                {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function CompanyList({ rows }: { rows: ProductionDetail["companies"] }) {
  if (rows.length === 0) return <Pending />;
  return (
    <ul className="space-y-2">
      {rows.map(({ company, link }) => (
        <li key={link.id} className="flex items-center justify-between rounded-lg border bg-card/50 px-4 py-2.5 text-sm">
          <span className="font-medium">{company.name}</span>
          <span className="text-xs text-muted-foreground">
            {COMPANY_ROLE_LABEL[link.role]}
            {link.region ? ` · ${link.region}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SourcesSection({ detail }: { detail: ProductionDetail }) {
  return (
    <>
      <Panel title="Source documents">
        {detail.sources.length === 0 ? (
          <Pending>No source documents cite this production yet.</Pending>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {detail.sources.map((doc) => (
              <li key={doc.id} className="flex gap-3 rounded-xl border bg-card/50 p-4">
                <FileText aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold leading-snug">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {SOURCE_DOCUMENT_KIND_LABEL[doc.kind as keyof typeof SOURCE_DOCUMENT_KIND_LABEL] ?? doc.kind} · received {formatDate(doc.received_at, "short")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Establishes: {doc.fields.map((f) => f ?? "the record itself").join(", ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Conflicting records">
        {detail.conflicts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sources disagree about this production.</p>
        ) : (
          <ul className="space-y-2">
            {detail.conflicts.map((c) => (
              <li key={c.id} className="rounded-xl border bg-card/50 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    Field <code className="rounded bg-muted px-1 font-mono text-xs">{c.field}</code>
                  </p>
                  <Badge variant={c.status === "open" ? "destructive" : "muted"}>{c.status === "open" ? "Awaiting review" : c.status === "accepted" ? "Correction accepted" : "Kept original"}</Badge>
                </div>
                <p className="mt-2 text-muted-foreground">
                  On record ({PROVENANCE_LABEL[c.current_provenance]}): <span className="font-mono text-foreground">{valueText(c.current_value)}</span>
                </p>
                <p className="text-muted-foreground">
                  Proposed: <span className="font-mono text-foreground">{valueText(c.proposed_value)}</span>
                </p>
                {c.note && <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Revision history">
        {detail.revisions.length === 0 ? (
          <Pending>No revisions recorded.</Pending>
        ) : (
          <ol className="relative space-y-4 border-l pl-6">
            {detail.revisions.map((r) => (
              <li key={r.id} className="relative">
                <span aria-hidden className="absolute -left-[1.85rem] top-1 grid size-5 place-items-center rounded-full border bg-background">
                  <History className="size-3 text-primary" />
                </span>
                <p className="text-sm font-medium">{r.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimestamp(r.created_at)}
                  {r.author ? ` · ${r.author}` : ""}
                  {r.changed_fields.length > 0 ? ` · ${r.changed_fields.join(", ")}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <ExternalLink aria-hidden className="size-3" /> Editors can compare and restore any version from the archive editor.
        </p>
      </Panel>
    </>
  );
}
