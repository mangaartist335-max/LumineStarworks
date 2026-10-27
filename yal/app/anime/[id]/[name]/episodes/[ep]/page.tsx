import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveNote, NA } from "@/components/ui";
import { loadAnime } from "@/lib/anime-page";
import { airedEpisodes, animeUrl, getAnimeAnyTime, visibleBroadcasts } from "@/lib/catalog";
import { getArchiveThread, threadVisible } from "@/lib/archive";
import { formatAirDate, formatBroadcastSlot, formatDateTime } from "@/lib/time";

export async function generateMetadata(props: PageProps<"/anime/[id]/[name]/episodes/[ep]">): Promise<Metadata> {
  const { id, ep } = await props.params;
  return { title: `${getAnimeAnyTime(Number(id))?.title ?? "Anime"} Episode ${ep}` };
}

export default async function AnimeEpisode(props: PageProps<"/anime/[id]/[name]/episodes/[ep]">) {
  const { id, ep } = await props.params;
  const load = await loadAnime(id);
  if (load.state !== "ok") return null;
  const { anime, asOf } = load;
  const num = Number(ep);
  const episode = airedEpisodes(anime, asOf).find((e) => e.number === num);
  const base = animeUrl(anime);
  if (!episode) {
    if (!Number.isInteger(num) || num < 1 || (anime.episodesPlanned !== null && num > anime.episodesPlanned)) notFound();
    return (
      <>
        <h2 className="section-h">Episode {num}</h2>
        <p>This episode has not aired yet at this point in time, or its record has not been archived.</p>
        <Link href={`${base}/episodes`} className="btn">
          &laquo; Episode List
        </Link>
      </>
    );
  }
  const thread = episode.threadId ? getArchiveThread(episode.threadId) : null;
  const streams = (anime.streaming ?? []).filter((s) => !s.visibleFrom || new Date(s.visibleFrom) <= new Date(asOf));
  const broadcast = visibleBroadcasts(anime, asOf);
  const slot = episode.airedAt ? formatBroadcastSlot(episode.airedAt) : null;

  return (
    <>
      <h2 className="section-h">
        Episode {episode.number}: {episode.title ?? <NA>Title not documented</NA>}
      </h2>
      <table className="yal-table" style={{ marginBottom: 12 }}>
        <tbody>
          <tr>
            <td style={{ width: 150 }}>
              <b>Japanese broadcast</b>
            </td>
            <td>
              {episode.airedAt && slot ? (
                <>
                  {formatAirDate(episode.airedAt)} ({slot.weekday} {slot.time} JST)
                  <span className="sub">Actual time: {formatDateTime(episode.airedAt)}</span>
                </>
              ) : (
                <NA />
              )}
            </td>
          </tr>
          <tr>
            <td>
              <b>Where to watch</b>
            </td>
            <td>
              {streams.length ? (
                streams.map((s) => (
                  <div key={s.name}>
                    {s.name} &mdash; {s.note}
                  </div>
                ))
              ) : (
                <NA>No legal streams are listed for this title.</NA>
              )}
              {broadcast
                .filter((b) => b.label.includes("MunchyRoll"))
                .map((b) => (
                  <span className="sub" key={b.label}>
                    {b.note}
                  </span>
                ))}
            </td>
          </tr>
          <tr>
            <td>
              <b>Discussion</b>
            </td>
            <td>
              {thread && threadVisible(thread, asOf) ? (
                <Link href={`/forum/thread/${thread.id}`}>{thread.title}</Link>
              ) : thread ? (
                <span className="muted">The discussion thread opens {formatDateTime(thread.createdAt)}.</span>
              ) : (
                <NA>No discussion thread.</NA>
              )}
            </td>
          </tr>
        </tbody>
      </table>
      <ArchiveNote>YAL lists where an episode can be watched; episodes themselves are not hosted here.</ArchiveNote>
      <div style={{ display: "flex", gap: 6 }}>
        {episode.number > 1 && (
          <Link href={`${base}/episodes/${episode.number - 1}`} className="btn">
            &laquo; Episode {episode.number - 1}
          </Link>
        )}
        <Link href={`${base}/episodes`} className="btn">
          Episode List
        </Link>
        {airedEpisodes(anime, asOf).some((e) => e.number === episode.number + 1) && (
          <Link href={`${base}/episodes/${episode.number + 1}`} className="btn">
            Episode {episode.number + 1} &raquo;
          </Link>
        )}
      </div>
    </>
  );
}
