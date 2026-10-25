import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle, SectionNav } from "@/components/SectionNav";
import { ArchiveNote, Cover, NA, fmtNum } from "@/components/ui";
import { animeCompanies, animeStatus, animeUrl, latestScore, seasonalAnime, seasonalOthers } from "@/lib/catalog";
import { animeStats } from "@/lib/stats";
import { getViewer } from "@/lib/viewer";
import { SEASONS, formatAirDate, formatBroadcastSlot, seasonLabel, seasonOf, type Season } from "@/lib/time";
import type { Anime } from "@/data/types";

export async function generateMetadata(props: PageProps<"/anime/season/[year]/[season]">): Promise<Metadata> {
  const { year, season } = await props.params;
  return { title: `${season[0]?.toUpperCase()}${season.slice(1)} ${year} Anime` };
}

async function SeasonCard({ anime, asOf }: { anime: Anime; asOf: string }) {
  const studios = animeCompanies(anime.studios, asOf);
  const score = latestScore(anime, asOf);
  const stats = await animeStats(anime.id, asOf);
  const status = animeStatus(anime, asOf);
  return (
    <div className="season-card">
      <div className="head">
        <Link href={animeUrl(anime)}>{anime.title}</Link>
        <div className="studio">{studios.length ? studios.map((s) => s.name).join(", ") : "Studio not documented"}</div>
      </div>
      <div className="body">
        <div className="cover">
          <Cover src={anime.cover} title={anime.title} small />
        </div>
        <div>
          <div>
            <b>{anime.type}</b>
            {anime.episodesPlanned !== null && `, ${anime.episodesPlanned} eps`}
          </div>
          <div>{status}</div>
          {anime.airedFrom && (
            <div>
              Starts {formatAirDate(anime.airedFrom)}
              {anime.broadcast && <span className="sub">{anime.broadcast}</span>}
            </div>
          )}
          <p style={{ margin: "6px 0 0" }}>{anime.synopsis ? `${anime.synopsis.slice(0, 160)}…` : <NA>No synopsis yet.</NA>}</p>
        </div>
      </div>
      <div className="genres">{anime.genres.length ? anime.genres.join(" · ") : "Genres not documented"}</div>
      <div className="foot">
        <span>Score: {score ? score.score.toFixed(2) : "N/A"}</span>
        <span>{fmtNum(stats.members)} members</span>
      </div>
    </div>
  );
}

export default async function SeasonPage(props: PageProps<"/anime/season/[year]/[season]">) {
  const { year: yearRaw, season: seasonRaw } = await props.params;
  const year = Number(yearRaw);
  const season = seasonRaw.toLowerCase() as Season;
  if (!Number.isInteger(year) || year < 2000 || year > 2014 || !SEASONS.includes(season)) notFound();
  const { asOf } = await getViewer();
  const { premiering, continuing } = seasonalAnime(year, season, asOf);
  const others = seasonalOthers(year, season, asOf);
  const idx = year * 4 + SEASONS.indexOf(season);
  const label = (i: number) => seasonLabel(SEASONS[i % 4], Math.floor(i / 4));
  const href = (i: number) => `/anime/season/${Math.floor(i / 4)}/${SEASONS[i % 4]}`;
  const now = seasonOf(asOf);
  const nowIdx = now.year * 4 + SEASONS.indexOf(now.season);
  const total = premiering.length + continuing.length + others.length;

  return (
    <>
      <Breadcrumb items={[{ label: "Anime", href: "/anime" }, { label: "Seasonal Anime", href: "/anime/season" }, { label: seasonLabel(season, year) }]} />
      <div className="page single">
        <main>
          <PageTitle title={`${seasonLabel(season, year)} Anime`} attached />
          <SectionNav section="anime" active="/anime/season" />
          <div className="controls" style={{ borderTop: "none", justifyContent: "space-between" }}>
            <Link href={href(idx - 1)} className="btn">
              &laquo; {label(idx - 1)}
            </Link>
            <span>
              <b>{seasonLabel(season, year)}</b>
              {idx === nowIdx && <span className="tag teal" style={{ marginLeft: 6 }}>current season</span>}
              {idx > nowIdx && <span className="tag gold" style={{ marginLeft: 6 }}>upcoming</span>}
            </span>
            {idx < 2014 * 4 + 3 ? (
              <Link href={href(idx + 1)} className="btn">
                {label(idx + 1)} &raquo;
              </Link>
            ) : (
              <span />
            )}
          </div>

          <div className="box" style={{ marginTop: 15 }}>
            <div className="box-head">TV (New) &mdash; {premiering.length}</div>
            {premiering.length ? (
              <div className="season-grid">
                {premiering.map((a) => (
                  <SeasonCard key={a.id} anime={a} asOf={asOf} />
                ))}
              </div>
            ) : (
              <div className="empty">{idx > nowIdx ? "No titles have been announced for this season yet." : "No new TV series for this season are in the archive."}</div>
            )}
          </div>

          {continuing.length > 0 && (
            <div className="box">
              <div className="box-head">TV (Continuing) &mdash; {continuing.length}</div>
              <div className="season-grid">
                {continuing.map((a) => (
                  <SeasonCard key={a.id} anime={a} asOf={asOf} />
                ))}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div className="box">
              <div className="box-head">Specials, OVAs &amp; Films &mdash; {others.length}</div>
              <table className="yal-table">
                <tbody>
                  {others.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <Link href={animeUrl(a)}>{a.title}</Link> <span className="muted">({a.type})</span>
                      </td>
                      <td>{a.airedFrom ? formatAirDate(a.airedFrom) : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <ArchiveNote>
            {total === 0
              ? "The archive has no records for this season. "
              : `${total} title${total === 1 ? "" : "s"} recorded for this season. `}
            Seasons list only the productions in the archive&apos;s catalogue.
            {premiering.some((a) => a.airedFrom && formatBroadcastSlot(a.airedFrom).time.startsWith("25")) &&
              " Late-night broadcast times use the Japanese 24+ hour convention (25:58 = 01:58 the next morning)."}
          </ArchiveNote>
        </main>
      </div>
    </>
  );
}
