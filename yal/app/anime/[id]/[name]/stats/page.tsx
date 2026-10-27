import type { Metadata } from "next";
import { ArchiveNote, NA, fmtNum } from "@/components/ui";
import { loadAnime } from "@/lib/anime-page";
import { getAnimeAnyTime, latestScore } from "@/lib/catalog";
import { animeStats } from "@/lib/stats";
import { LIST_STATUSES } from "@/lib/store/types";
import { allArchivePosts } from "@/lib/archive";
import { formatDate, formatDateTime, happened, startOfJstDay, zoneParts } from "@/lib/time";

export async function generateMetadata(props: PageProps<"/anime/[id]/[name]/stats">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `${getAnimeAnyTime(Number(id))?.title ?? "Anime"} - Stats` };
}

const STATUS_CLASS: Record<string, string> = {
  Watching: "st-watching",
  Completed: "st-completed",
  "On-Hold": "st-onhold",
  Dropped: "st-dropped",
  "Plan to Watch": "st-ptw",
};

export default async function AnimeStatsPage(props: PageProps<"/anime/[id]/[name]/stats">) {
  const { id } = await props.params;
  const load = await loadAnime(id);
  if (load.state !== "ok") return null;
  const { anime, asOf } = load;
  const stats = await animeStats(anime.id, asOf);
  const score = latestScore(anime, asOf);
  const maxStatus = Math.max(1, ...Object.values(stats.statusCounts));
  const maxScore = Math.max(1, ...stats.memberScores.distribution);

  // Forum activity per JST day for this anime's discussion threads.
  const posts = allArchivePosts().filter((p) => p.threadId.startsWith("ioe-ep") && anime.episodeList.some((e) => e.threadId && p.threadId === e.threadId) && happened(p.at, asOf));
  const byDay = new Map<string, number>();
  for (const p of posts) {
    const k = startOfJstDay(p.at);
    byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }
  const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  const maxDay = Math.max(1, ...days.map(([, n]) => n));

  return (
    <>
      <h2 className="section-h">Summary Stats</h2>
      <div className="stat-grid">
        <div className="stat-tile">
          Members
          <b>{fmtNum(stats.members)}</b>
        </div>
        <div className="stat-tile">
          Archived score
          <b>{score ? score.score.toFixed(2) : <NA />}</b>
          {score && `${fmtNum(score.scoredBy)} users · ${formatDate(score.capturedAt)}`}
        </div>
        <div className="stat-tile">
          Member scores here
          <b>{stats.memberScores.average ?? <NA />}</b>
          {stats.memberScores.count} scored
        </div>
        <div className="stat-tile">
          Favorites
          <b>{fmtNum(stats.favorites)}</b>
        </div>
      </div>

      <h2 className="section-h">List Status</h2>
      <div className="bars">
        {LIST_STATUSES.map((s) => (
          <div className="bar-row" key={s}>
            <span>
              <span className={`status-dot ${STATUS_CLASS[s]}`} />
              {s}
            </span>
            <div className="bar">
              <div className="fill" style={{ width: `${(stats.statusCounts[s] / maxStatus) * 100}%` }} />
            </div>
            <span className="val">{fmtNum(stats.statusCounts[s])}</span>
          </div>
        ))}
      </div>
      {stats.derivedWatchers > 0 && (
        <ArchiveNote>
          {fmtNum(stats.derivedWatchers)} of these are archive members counted as Watching because they posted in this title&apos;s episode threads. Their full lists were not recovered.
        </ArchiveNote>
      )}

      <h2 className="section-h">Score Distribution (members of this archive)</h2>
      {stats.memberScores.count ? (
        <div className="bars">
          {stats.memberScores.distribution
            .map((n, i) => ({ n, score: i + 1 }))
            .reverse()
            .map(({ n, score: sc }) => (
              <div className="bar-row" key={sc}>
                <span>{sc}</span>
                <div className="bar">
                  <div className="fill gold" style={{ width: `${(n / maxScore) * 100}%` }} />
                </div>
                <span className="val">{n}</span>
              </div>
            ))}
        </div>
      ) : (
        <p>
          <NA>No member scores yet.</NA>
        </p>
      )}

      {days.length > 0 && (
        <>
          <h2 className="section-h">Episode Discussion Activity (posts per day, JST)</h2>
          <div className="col-chart" role="img" aria-label="Posts per day in episode discussions">
            {days.map(([d, n]) => (
              <div key={d} className="col" style={{ height: `${(n / maxDay) * 100}%` }} title={`${formatDate(d)}: ${n} posts`} />
            ))}
          </div>
          <div className="col-labels">
            {days.map(([d]) => (
              <span key={d}>{zoneParts(d).d}</span>
            ))}
          </div>
          <p className="hint">
            {fmtNum(posts.length)} recovered posts as of {formatDateTime(asOf)}.
          </p>
        </>
      )}
    </>
  );
}
