import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveNote, NA, fmtNum } from "@/components/ui";
import { loadAnime } from "@/lib/anime-page";
import { airedEpisodes, animeUrl, getAnimeAnyTime, nextEpisodeSlot } from "@/lib/catalog";
import { getArchiveThread, threadVisible } from "@/lib/archive";
import { summarize } from "@/lib/forum";
import { formatAirDate, formatBroadcastSlot } from "@/lib/time";

export async function generateMetadata(props: PageProps<"/anime/[id]/[name]/episodes">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `${getAnimeAnyTime(Number(id))?.title ?? "Anime"} - Episodes` };
}

export default async function AnimeEpisodes(props: PageProps<"/anime/[id]/[name]/episodes">) {
  const { id } = await props.params;
  const load = await loadAnime(id);
  if (load.state !== "ok") return null;
  const { anime, asOf } = load;
  const aired = airedEpisodes(anime, asOf);
  const next = nextEpisodeSlot(anime, asOf);
  const rows = await Promise.all(
    aired.map(async (e) => {
      const t = e.threadId ? getArchiveThread(e.threadId) : null;
      const visible = t && threadVisible(t, asOf) ? t : null;
      const s = visible ? await summarize({ ...visible, origin: "archive" }, asOf) : null;
      return { e, thread: visible, replies: s ? (s.snapshot ? s.snapshot.replies : s.replies) : null };
    }),
  );
  const base = animeUrl(anime);

  return (
    <>
      <h2 className="section-h">
        Episodes
        <span className="more">{anime.episodesPlanned !== null ? `${aired.length} of ${anime.episodesPlanned} aired` : `${aired.length} archived`}</span>
      </h2>
      {rows.length === 0 && !next ? (
        <p>
          <NA>No episode information has been added to this title.</NA>
        </p>
      ) : (
        <table className="yal-table">
          <thead>
            <tr>
              <th className="num">#</th>
              <th>Title</th>
              <th>Aired</th>
              <th className="num">Forum</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ e, thread, replies }) => (
              <tr key={e.number}>
                <td className="num">{e.number}</td>
                <td>
                  <Link href={`${base}/episodes/${e.number}`}>{e.title ?? <NA>Title not documented</NA>}</Link>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {e.airedAt ? (
                    <>
                      {formatAirDate(e.airedAt)}
                      <span className="sub">{formatBroadcastSlot(e.airedAt).weekday} {formatBroadcastSlot(e.airedAt).time} JST</span>
                    </>
                  ) : (
                    <NA />
                  )}
                </td>
                <td className="num">
                  {thread ? <Link href={`/forum/thread/${thread.id}`}>Discussion ({fmtNum(replies ?? 0)})</Link> : <NA>No thread yet</NA>}
                </td>
              </tr>
            ))}
            {next && !next.aired && (
              <tr>
                <td className="num">{next.number}</td>
                <td className="muted">Not aired yet</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {formatAirDate(next.at)}
                  <span className="sub">Next airing ({formatBroadcastSlot(next.at).weekday} {formatBroadcastSlot(next.at).time} JST)</span>
                </td>
                <td className="num">
                  <NA>-</NA>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      {next && next.aired && (
        <ArchiveNote>
          Records for Episode {next.number} onward have not been entered into the archive yet. Episode titles and air dates are added only from documented sources.
        </ArchiveNote>
      )}
      {next && !next.aired && (
        <ArchiveNote>The next air date follows the weekly broadcast slot.</ArchiveNote>
      )}
    </>
  );
}
