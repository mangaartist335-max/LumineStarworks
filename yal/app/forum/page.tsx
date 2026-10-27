import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle } from "@/components/SectionNav";
import { fmtNum } from "@/components/ui";
import { allBoards } from "@/lib/archive";
import { boardThreads } from "@/lib/forum";
import { getViewer } from "@/lib/viewer";
import { relativeTo } from "@/lib/time";

export const metadata: Metadata = { title: "Forums" };

export default async function ForumIndex() {
  const { asOf, account } = await getViewer();
  const boards = allBoards();
  const all = await boardThreads(null, asOf);
  const groups = [...new Set(boards.map((b) => b.group))];

  return (
    <>
      <Breadcrumb items={[{ label: "Forums" }]} />
      <div className="page">
        <main>
          <PageTitle title="YourAnimeList Forums" />
          <table className="yal-table forum-table box" style={{ display: "table" }}>
            {groups.map((g) => (
              <tbody key={g}>
                <tr className="forum-group">
                  <th>{g}</th>
                  <th className="num">Topics</th>
                  <th className="num">Posts</th>
                  <th>Last Post</th>
                </tr>
                {boards
                  .filter((b) => b.group === g)
                  .map((b) => {
                    const threads = all.filter((t) => t.thread.board === b.slug);
                    const posts = threads.reduce((n, t) => n + (t.archivedReplies ?? (t.snapshot && t.thread.origin === "archive" ? t.snapshot.replies : t.replies)) + 1, 0);
                    const last = threads.filter((t) => t.last).sort((a, z) => new Date(z.last!.at).getTime() - new Date(a.last!.at).getTime())[0];
                    return (
                      <tr key={b.slug}>
                        <td className="topic">
                          <Link className="title" href={`/forum/board/${b.slug}`}>
                            {b.name}
                          </Link>
                          <span className="sub">{b.description}</span>
                        </td>
                        <td className="num">{fmtNum(threads.length)}</td>
                        <td className="num">{fmtNum(threads.length ? posts : 0)}</td>
                        <td className="last">
                          {last ? (
                            <>
                              <Link href={`/forum/thread/${last.thread.id}`}>{last.thread.title.length > 38 ? `${last.thread.title.slice(0, 37)}…` : last.thread.title}</Link>
                              <br />
                              {relativeTo(last.last!.at, asOf)} by {last.last!.author}
                            </>
                          ) : (
                            <span className="na">No posts yet</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            ))}
          </table>
        </main>
        <aside className="sidebar">
          <div className="side-card">
            <div className="side-head">Forum Tools</div>
            <div className="side-body">
              <ul>
                <li>
                  <Link href="/forum/new">Start a new topic</Link>
                </li>
                <li>
                  <Link href="/search?type=forum">Search the forums</Link>
                </li>
                {account && (
                  <li>
                    <Link href="/forum/following">Topics you follow</Link>
                  </li>
                )}
                <li>
                  <Link href="/forum/thread/t-20114">Episode Discussion rules</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="side-card">
            <div className="side-head">Recently Active Topics</div>
            <div className="side-body">
              <ul>
                {all
                  .filter((t) => t.last)
                  .sort((a, z) => new Date(z.last!.at).getTime() - new Date(a.last!.at).getTime())
                  .slice(0, 6)
                  .map((t) => (
                    <li key={t.thread.id}>
                      <Link href={`/forum/thread/${t.thread.id}`}>{t.thread.title}</Link>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
