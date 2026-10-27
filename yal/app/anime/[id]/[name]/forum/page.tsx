import type { Metadata } from "next";
import Link from "next/link";
import { NA, fmtNum } from "@/components/ui";
import { loadAnime } from "@/lib/anime-page";
import { getAnimeAnyTime } from "@/lib/catalog";
import { boardThreads } from "@/lib/forum";
import { getBoard } from "@/lib/archive";
import { relativeTo } from "@/lib/time";
import { getViewer } from "@/lib/viewer";

export async function generateMetadata(props: PageProps<"/anime/[id]/[name]/forum">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `${getAnimeAnyTime(Number(id))?.title ?? "Anime"} - Forum` };
}

export default async function AnimeForum(props: PageProps<"/anime/[id]/[name]/forum">) {
  const { id } = await props.params;
  const load = await loadAnime(id);
  if (load.state !== "ok") return null;
  const { anime, asOf } = load;
  const viewer = await getViewer();
  const threads = (await boardThreads(null, asOf)).filter((t) => t.thread.animeId === anime.id);

  return (
    <>
      <h2 className="section-h">
        Forum Discussions
        {viewer.account && (
          <span className="more">
            <Link href={`/forum/new?board=general&anime=${anime.id}`}>Start a new topic</Link>
          </span>
        )}
      </h2>
      {threads.length ? (
        <table className="yal-table forum-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th className="num">Replies</th>
              <th>Last Post</th>
            </tr>
          </thead>
          <tbody>
            {threads.map((t) => (
              <tr key={t.thread.id}>
                <td className="topic">
                  {t.thread.pinned && <span className="tag teal">Sticky</span>}{" "}
                  <Link className="title" href={`/forum/thread/${t.thread.id}`}>
                    {t.thread.title}
                  </Link>
                  <span className="sub">
                    {getBoard(t.thread.board)?.name}
                    {t.thread.postsRecovered === false ? " · posts not recovered" : ` · by ${t.thread.author}`}
                  </span>
                </td>
                <td className="num">{fmtNum(t.archivedReplies ?? (t.snapshot && t.thread.origin === "archive" ? t.snapshot.replies : t.replies))}</td>
                <td className="last">{t.last ? <>{relativeTo(t.last.at, asOf)}<br />by {t.last.author}</> : <NA>-</NA>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>
          <NA>No discussions yet.</NA>
        </p>
      )}
    </>
  );
}
