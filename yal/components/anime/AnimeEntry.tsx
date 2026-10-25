import Link from "next/link";
import type { Anime } from "@/data/types";
import { Cover } from "@/components/ui";
import { animeCompanies, animeStatus, animeUrl, animeYear, latestScore } from "@/lib/catalog";

export function AnimeEntry({ anime, asOf, extra }: { anime: Anime; asOf: string; extra?: React.ReactNode }) {
  const score = latestScore(anime, asOf);
  const studios = animeCompanies(anime.studios, asOf);
  const status = animeStatus(anime, asOf);
  const year = animeYear(anime);
  return (
    <div className="entry">
      <div className="thumb">
        <Link href={animeUrl(anime)} aria-hidden tabIndex={-1}>
          <Cover src={anime.cover} title={anime.title} small />
        </Link>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={animeUrl(anime)} className="title">
          {anime.title}
        </Link>
        <div className="meta">
          {anime.type === "Unknown" ? "Type unknown" : anime.type}
          {anime.episodesPlanned !== null && ` · ${anime.episodesPlanned} eps`}
          {year !== null ? ` · ${year}` : " · Year not documented"}
          {studios.length > 0 && ` · ${studios.map((s) => s.name).join(", ")}`}
          {status !== "Not documented" && ` · ${status}`}
        </div>
        {anime.genres.length > 0 && <div className="meta">{anime.genres.join(", ")}</div>}
        {extra}
      </div>
      <div className="meta" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        {score ? (
          <>
            <b style={{ fontSize: 14, color: "var(--brand-dark)" }}>{score.score.toFixed(2)}</b>
            <br />
            score
          </>
        ) : (
          <span className="na">N/A</span>
        )}
      </div>
    </div>
  );
}
