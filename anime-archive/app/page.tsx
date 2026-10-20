import { ArrowRight, CalendarRange, Cake, Clock, Film, Network, Sparkles } from "lucide-react";
import Link from "next/link";
import { PosterArt } from "@/components/archive/poster-art";
import { ProductionGrid, ProductionRow } from "@/components/archive/production-card";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { SectionHeading } from "@/components/archive/section-heading";
import { EmptyState } from "@/components/archive/empty-state";
import { Button } from "@/components/ui/button";
import { daysBetween, formatDate } from "@/lib/archive/dates";
import { FORMAT_SHORT, SEASON_MONTHS, SEASON_NATIVE } from "@/lib/archive/labels";
import {
  archiveStats,
  getAnniversaries,
  getConfirmedHighlights,
  getRecentlyAdded,
  getSeasonListing,
  getUpcoming,
  getYearCounts,
  summarizeFranchises,
  summarizeStudios,
} from "@/lib/archive/queries";
import { ARCHIVE_END_YEAR, ARCHIVE_START_YEAR, formatSeason, seasonHref, seasonOfDate } from "@/lib/archive/seasons";
import { archiveToday, loadArchive } from "@/lib/archive/server";
import { plural } from "@/lib/utils";

export default async function HomePage() {
  const index = await loadArchive();
  const today = archiveToday();
  const current = seasonOfDate(today);
  const season = getSeasonListing(index, current, today);
  const franchises = summarizeFranchises(index, today);
  const featured = franchises.find((f) => f.provenance === "confirmed" && f.entries > 1) ?? franchises[0];
  const featuredTimeline = featured ? index.franchiseEntries(index.franchisesBySlug.get(featured.slug)!.id) : [];
  const stats = archiveStats(index);
  const confirmed = getConfirmedHighlights(index, today);
  const upcoming = getUpcoming(index, today, 6);
  const anniversaries = getAnniversaries(index, today).slice(0, 6);
  const studios = summarizeStudios(index, today).slice(0, 4);
  const recent = getRecentlyAdded(index, today, 6);
  const { years, decades } = getYearCounts(index);

  return (
    <div className="pb-8">
      {/* Hero: featured franchise */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden border-b">
        <div aria-hidden className="starfield absolute inset-0" />
        <div aria-hidden className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-primary/15 blur-3xl" />
        <div aria-hidden className="absolute -bottom-48 right-0 size-[30rem] rounded-full bg-star/10 blur-3xl" />
        <div className="container-page relative grid gap-10 py-12 lg:grid-cols-[1.15fr_1fr] lg:py-16">
          <div className="flex flex-col justify-center gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles aria-hidden className="size-3.5 text-star" />
                Anime Industry Archive · {ARCHIVE_START_YEAR}–{ARCHIVE_END_YEAR}
              </span>
            </div>
            <h1 id="hero-title" className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Every season, every studio, <span className="bg-gradient-to-r from-primary via-primary to-star bg-clip-text text-transparent">every credit.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Browse two decades of anime by broadcast season, open any production to see its full creative team, and follow franchises from their
              first episode to their latest film.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={seasonHref(current)}>
                  <CalendarRange aria-hidden />
                  {formatSeason(current)} season
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/seasons">Open the seasonal calendar</Link>
              </Button>
            </div>
            <dl className="grid max-w-lg grid-cols-4 gap-4 pt-2">
              {[
                ["Productions", stats.productions],
                ["Studios", stats.studios],
                ["People", stats.people],
                ["Franchises", stats.franchises],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-mono text-2xl font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {featured && (
            <div className="relative rounded-2xl border bg-card/70 p-5 shadow-2xl shadow-primary/5 backdrop-blur">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Featured franchise</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight">{featured.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {plural(featured.entries, "entry", "entries")}
                    {featured.first_year && ` · ${featured.first_year}–${featured.last_year}`}
                    {featured.studios.length > 0 && ` · ${featured.studios.join(" → ")}`}
                  </p>
                </div>
                <ProvenanceBadge provenance={featured.provenance} />
              </div>
              <ol className="grid grid-cols-4 gap-3">
                {featuredTimeline.slice(0, 4).map((p) => (
                  <li key={p.id}>
                    <Link href={`/anime/${p.slug}`} className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <PosterArt
                        slug={p.slug}
                        title={p.season_number ? `Season ${p.season_number}` : p.title}
                        glyph={p.season_number ? String(p.season_number) : undefined}
                        format={p.format}
                        year={p.premiere_year}
                        size="sm"
                        className="transition group-hover:-translate-y-1"
                      />
                      <span className="sr-only">{p.title}</span>
                    </Link>
                  </li>
                ))}
              </ol>
              <Button asChild variant="secondary" className="mt-5 w-full">
                <Link href={`/franchises/${featured.slug}`}>
                  Follow the franchise timeline <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <div className="container-page space-y-16 pt-14">
        {/* Current season */}
        <section aria-labelledby="current-season">
          <SectionHeading
            id="current-season"
            eyebrow={`${SEASON_NATIVE[current.season]} · ${SEASON_MONTHS[current.season]}`}
            title={`${formatSeason(current)} season`}
            description={`${plural(season.premieres.length, "new production")} this season${season.continuing.length ? `, plus ${season.continuing.length} continuing from earlier seasons` : ""}.`}
            href={seasonHref(current)}
            linkLabel="Full season"
          />
          {season.premieres.length + season.continuing.length > 0 ? (
            <ProductionGrid productions={[...season.premieres, ...season.continuing].slice(0, 6)} />
          ) : (
            <EmptyState title="No productions recorded for this season yet" description="Editors can add this season's lineup from the archive editor." />
          )}
        </section>

        {/* Confirmed chronology */}
        <section aria-labelledby="confirmed">
          <SectionHeading
            id="confirmed"
            eyebrow="Featured anime"
            title="From the confirmed chronology"
            description="Productions established by approved source documents. Details that haven't been documented yet are left blank rather than guessed."
            href="/anime?provenance=confirmed&sort=premiere"
          />
          <div className="grid gap-3 md:grid-cols-2">
            {confirmed.map((p) => (
              <ProductionRow key={p.id} production={p} />
            ))}
          </div>
        </section>

        {/* Upcoming + anniversaries */}
        <div className="grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="upcoming">
            <SectionHeading id="upcoming" eyebrow="Coming soon" title="Upcoming premieres" />
            {upcoming.length ? (
              <ul className="divide-y rounded-xl border bg-card/50">
                {upcoming.map((p) => {
                  const days = p.premiere_date ? daysBetween(today, p.premiere_date) : null;
                  return (
                    <li key={p.id}>
                      <Link href={`/anime/${p.slug}`} className="group flex items-center gap-4 p-3 transition-colors hover:bg-accent/40">
                        <div className="grid w-14 shrink-0 place-items-center rounded-lg bg-star/12 py-2 text-center">
                          <Clock aria-hidden className="size-4 text-star" />
                          <span className="mt-1 font-mono text-xs font-semibold">{days !== null ? `${days}d` : "TBA"}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold group-hover:text-primary">{p.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {FORMAT_SHORT[p.format]} · {p.studios.map((s) => s.name).join(", ")} · {formatDate(p.premiere_date, "short")}
                          </p>
                        </div>
                        <ProvenanceBadge provenance={p.provenance} compact />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={Clock} title="No announced premieres" description="Upcoming productions appear here as soon as their dates are recorded." />
            )}
          </section>

          <section aria-labelledby="anniversaries">
            <SectionHeading id="anniversaries" eyebrow="This month in anime history" title="Anniversaries" />
            {anniversaries.length ? (
              <ul className="divide-y rounded-xl border bg-card/50">
                {anniversaries.map((a) => (
                  <li key={a.production.id}>
                    <Link href={`/anime/${a.production.slug}`} className="group flex items-center gap-4 p-3 transition-colors hover:bg-accent/40">
                      <div className={`grid w-14 shrink-0 place-items-center rounded-lg py-2 text-center ${a.milestone ? "bg-primary/15" : "bg-muted"}`}>
                        <Cake aria-hidden className={`size-4 ${a.milestone ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="mt-1 font-mono text-xs font-semibold">{a.years}y</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold group-hover:text-primary">{a.production.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          Premiered {formatDate(a.production.premiere_date)} · {a.years} years {a.date > today ? "on" : "since"} {formatDate(a.date, "short")}
                        </p>
                      </div>
                      <ProvenanceBadge provenance={a.production.provenance} compact />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Cake} title="No anniversaries around today" description="Check back next week — there's always a premiere birthday coming up." />
            )}
          </section>
        </div>

        {/* Franchises */}
        <section aria-labelledby="franchises">
          <SectionHeading id="franchises" eyebrow="Series & sequels" title="Popular franchises" href="/franchises" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {franchises.slice(0, 8).map((f) => (
              <Link
                key={f.slug}
                href={`/franchises/${f.slug}`}
                className="group relative overflow-hidden rounded-xl border bg-card/60 p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <Network aria-hidden className="size-5 text-primary" />
                  <ProvenanceBadge provenance={f.provenance} compact={f.provenance !== "confirmed"} />
                </div>
                <h3 className="mt-3 font-semibold leading-snug group-hover:text-primary">{f.name}</h3>
                {f.name_native && <p className="font-jp text-xs text-muted-foreground">{f.name_native}</p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  {plural(f.entries, "entry", "entries")}
                  {f.first_year && ` · ${f.first_year === f.last_year ? f.first_year : `${f.first_year}–${f.last_year}`}`}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {f.formats.map((fmt) => (
                    <span key={fmt} className="rounded bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                      {FORMAT_SHORT[fmt]}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Studios */}
        <section aria-labelledby="studios">
          <SectionHeading id="studios" eyebrow="Studio spotlights" title="The studios behind the archive" href="/studios" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {studios.map((s) => (
              <Link key={s.slug} href={`/studios/${s.slug}`} className="group flex flex-col rounded-xl border bg-card/60 p-4 transition-colors hover:border-primary/40">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Film aria-hidden className="size-5" />
                  </span>
                  <ProvenanceBadge provenance={s.provenance} compact={s.provenance !== "confirmed"} />
                </div>
                <h3 className="mt-3 font-semibold group-hover:text-primary">{s.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {[s.founded_year && `Founded ${s.founded_year}`, s.location].filter(Boolean).join(" · ") || "Founding details not yet documented"}
                </p>
                <p className="mt-3 text-sm">
                  <span className="font-mono font-bold">{s.productions}</span> <span className="text-muted-foreground">productions in the archive</span>
                </p>
                {s.latest && <p className="mt-1 truncate text-xs text-muted-foreground">Latest: {s.latest.title}</p>}
              </Link>
            ))}
          </div>
        </section>

        {/* Recently added */}
        <section aria-labelledby="recent">
          <SectionHeading id="recent" eyebrow="Archive activity" title="Recently added records" href="/anime?sort=premiere_desc" />
          <div className="grid gap-3 md:grid-cols-2">
            {recent.map((p) => (
              <ProductionRow key={p.id} production={p} />
            ))}
          </div>
        </section>

        {/* Browse by year / decade */}
        <section aria-labelledby="by-year">
          <SectionHeading id="by-year" eyebrow="Browse by year and decade" title="Two decades of broadcasts" href="/seasons" linkLabel="Seasonal calendar" />
          <div className="space-y-6">
            {decades.map((d) => (
              <div key={d.decade} className="grid gap-3 md:grid-cols-[10rem_1fr] md:items-center">
                <Link href={`/anime?decade=${d.decade}`} className="group">
                  <p className="text-2xl font-extrabold tracking-tight group-hover:text-primary">{d.decade}s</p>
                  <p className="text-xs text-muted-foreground">{plural(d.count, "production")}</p>
                </Link>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                  {years
                    .filter((y) => Math.floor(y.year / 10) * 10 === d.decade)
                    .map((y) => (
                      <Link
                        key={y.year}
                        href={`/anime?year=${y.year}&sort=premiere`}
                        className="group rounded-lg border bg-card/50 px-2 py-2 text-center transition-colors hover:border-primary/50 hover:bg-accent/40"
                      >
                        <span className="block font-mono text-sm font-semibold group-hover:text-primary">{y.year}</span>
                        <span className="block text-[0.65rem] text-muted-foreground">{y.count || "—"}</span>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
