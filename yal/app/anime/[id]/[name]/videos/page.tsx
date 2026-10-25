import type { Metadata } from "next";
import Link from "next/link";
import { NA } from "@/components/ui";
import { loadAnime } from "@/lib/anime-page";
import { airedEpisodes, animeUrl, getAnimeAnyTime, visibleThemeSongs } from "@/lib/catalog";
import { formatAirDate } from "@/lib/time";

export async function generateMetadata(props: PageProps<"/anime/[id]/[name]/videos">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `${getAnimeAnyTime(Number(id))?.title ?? "Anime"} - Videos` };
}

export default async function AnimeVideos(props: PageProps<"/anime/[id]/[name]/videos">) {
  const { id } = await props.params;
  const load = await loadAnime(id);
  if (load.state !== "ok") return null;
  const { anime, asOf } = load;
  const episodes = airedEpisodes(anime, asOf);
  const songs = visibleThemeSongs(anime, asOf);
  const base = animeUrl(anime);

  return (
    <>
      <h2 className="section-h">Promotional Videos</h2>
      <p>
        <NA>No promotional videos have been added to this title.</NA>
      </p>

      <h2 className="section-h">Episode Videos</h2>
      {episodes.length ? (
        <table className="yal-table">
          <tbody>
            {episodes.map((e) => (
              <tr key={e.number}>
                <td className="num" style={{ width: 40 }}>
                  {e.number}
                </td>
                <td>
                  <Link href={`${base}/episodes/${e.number}`}>{e.title ?? `Episode ${e.number}`}</Link>
                  <span className="sub">Streaming details and where to watch</span>
                </td>
                <td className="muted">{e.airedAt ? formatAirDate(e.airedAt) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>
          <NA>No episode videos are listed.</NA>
        </p>
      )}

      <h2 className="section-h">Music Videos</h2>
      {songs.length ? (
        <ul>
          {songs.map((s) => (
            <li key={s.title}>
              {s.kind}: &quot;{s.title}&quot; by {s.artist} <span className="muted">(no video added)</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          <NA>No music videos have been added.</NA>
        </p>
      )}
    </>
  );
}
