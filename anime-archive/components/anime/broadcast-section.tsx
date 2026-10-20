import { CalendarClock, Radio, Tv } from "lucide-react";
import { IssueList } from "@/components/archive/issue-list";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { Badge } from "@/components/ui/badge";
import { formatBroadcastTime, formatDate, formatDateRange } from "@/lib/archive/dates";
import { BROADCAST_KIND_LABEL, CADENCE_LABEL, LANGUAGE_LABEL, WEEKDAY_LABEL } from "@/lib/archive/labels";
import type { ProductionDetail } from "@/lib/archive/queries";
import { formatSeason } from "@/lib/archive/seasons";
import { InfoList, Panel, Pending } from "./info-list";

export function BroadcastSection({ detail }: { detail: ProductionDetail }) {
  const { runs, timeline, production, episodes } = detail;

  return (
    <div className="space-y-8">
      {timeline.premiere && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card/50 p-4 text-sm">
          <CalendarClock aria-hidden className="size-4 text-primary" />
          <span>
            Premiere season: <strong>{formatSeason(timeline.premiere)}</strong>
          </span>
          {timeline.continuing.length > 0 && (
            <span className="text-muted-foreground">
              · Broadcast continues through {timeline.continuing.map(formatSeason).join(", ")} ({timeline.cours} cours). It stays listed under its premiere season.
            </span>
          )}
        </div>
      )}

      {runs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          {production.format === "film" ? (
            <>
              Theatrical release{production.premiere_year ? ` in ${production.premiere_year}` : ""}.{" "}
              {production.premiere_date ? `Released ${formatDate(production.premiere_date)}.` : "The exact release date has not been documented yet."}
            </>
          ) : (
            "No broadcast runs have been recorded for this production yet."
          )}
        </div>
      ) : (
        runs.map(({ run, network, analysis, projected, releases }) => {
          const weekday = analysis.weekday;
          const count = run.episode_count ?? analysis.inferred_episode_count;
          return (
            <article key={run.id} className="space-y-4 rounded-xl border bg-card/40 p-5">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                    {run.kind === "dub" ? <Radio aria-hidden className="size-5" /> : <Tv aria-hidden className="size-5" />}
                  </span>
                  <div>
                    <h3 className="font-semibold">{run.label ?? BROADCAST_KIND_LABEL[run.kind]}</h3>
                    <p className="text-xs text-muted-foreground">
                      {BROADCAST_KIND_LABEL[run.kind]} · {LANGUAGE_LABEL[run.language] ?? run.language}
                      {run.region ? ` · ${run.region}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {run.is_primary && <Badge variant="secondary">Primary run</Badge>}
                  <ProvenanceBadge provenance={run.provenance} />
                </div>
              </header>

              <InfoList
                items={[
                  { label: "Dates", value: run.start_date || run.end_date ? formatDateRange(run.start_date, run.end_date) : null },
                  { label: "Network / platform", value: network },
                  {
                    label: "Broadcast day",
                    value: weekday !== null ? `${WEEKDAY_LABEL[weekday]}s` : run.cadence === "single" ? "Single airing" : null,
                    hint: analysis.weekday_source === "derived" ? "derived from the premiere date" : undefined,
                  },
                  { label: "Time", value: formatBroadcastTime(run.local_time, run.time_zone) },
                  { label: "Time zone", value: run.time_zone },
                  {
                    label: "Episodes",
                    value: count !== null ? String(count) : null,
                    hint: run.episode_count === null && count !== null ? "inferred from weekly dates, not yet confirmed" : undefined,
                  },
                  { label: "Cadence", value: CADENCE_LABEL[run.cadence] },
                  {
                    label: "Skipped weeks",
                    value: run.skipped_dates.length ? run.skipped_dates.map((d) => formatDate(d, "short")).join(", ") : run.cadence === "weekly" ? "None recorded" : "—",
                  },
                  ...(run.notes ? [{ label: "Notes", value: run.notes }] : []),
                ]}
              />

              <IssueList issues={analysis.issues} />

              {(releases.length > 0 || projected.length > 0) && (
                <details className="group rounded-lg border bg-background/40">
                  <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium marker:text-muted-foreground">
                    {releases.length > 0 ? `Episode air dates (${releases.length})` : `Projected weekly schedule (${projected.length} episodes)`}
                  </summary>
                  {releases.length === 0 && (
                    <p className="px-4 pb-2 text-xs text-muted-foreground">
                      Projected from the premiere date and recorded skipped weeks. Individual episode dates haven&apos;t been confirmed yet.
                    </p>
                  )}
                  <ol className="grid grid-cols-2 gap-x-6 gap-y-1 px-4 pb-4 font-mono text-xs sm:grid-cols-3 lg:grid-cols-4">
                    {(releases.length ? releases : projected).map((e) => (
                      <li key={`${e.number}-${e.date}`} className="flex justify-between gap-2 border-b border-dashed py-1">
                        <span className="text-muted-foreground">Ep {e.number}</span>
                        <span>{formatDate(e.date, "short")}</span>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </article>
          );
        })
      )}

      <Panel title="Episodes">
        {episodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <Pending>Episode titles haven&apos;t been documented yet.</Pending>
          </p>
        ) : (
          <ol className="divide-y rounded-xl border bg-card/40">
            {episodes.map((ep) => (
              <li key={ep.id} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[4rem_1fr_auto]">
                <span className="font-mono text-muted-foreground">#{ep.number}</span>
                <span>
                  <span className="font-medium">{ep.title ?? <Pending>Title pending</Pending>}</span>
                  {ep.title_native && <span className="ml-2 font-jp text-xs text-muted-foreground">{ep.title_native}</span>}
                </span>
                <span className="flex flex-wrap gap-2 font-mono text-xs text-muted-foreground">
                  {ep.releases.map((r) => (
                    <span key={r.id} title={r.run?.label ?? undefined}>
                      {r.run ? `${r.run.kind === "dub" ? "EN" : r.run.kind === "advance" ? "ADV" : "JP"} ` : ""}
                      {formatDate(r.air_date, "short")}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
