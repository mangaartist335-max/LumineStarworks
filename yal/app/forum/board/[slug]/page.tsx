import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle } from "@/components/SectionNav";
import { NA, Pagination, fmtNum } from "@/components/ui";
import { getBoard } from "@/lib/archive";
import { boardThreads } from "@/lib/forum";
import { getViewer } from "@/lib/viewer";
import { formatDate, relativeTo } from "@/lib/time";

const PER_PAGE = 25;

export async function generateMetadata(props: PageProps<"/forum/board/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: getBoard(slug)?.name ?? "Forum" };
}

export default async function BoardPage(props: PageProps<"/forum/board/[slug]">) {
  const { slug } = await props.params;
  const sp = await props.searchParams;
  const board = getBoard(slug);
  if (!board) notFound();
  const { asOf, account } = await getViewer();
  const threads = await boardThreads(slug, asOf);
  const pages = Math.max(1, Math.ceil(threads.length / PER_PAGE));
  const page = Math.min(Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1), pages);
  const shown = threads.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <Breadcrumb items={[{ label: "Forums", href: "/forum" }, { label: board.name }]} />
      <div className="page single">
        <main>
          <PageTitle title={board.name} subtitle={board.description} />
          <div className="controls" style={{ borderTop: "1px solid var(--line-dark)" }}>
            {slug === "episode" ? (
              <span className="hint">Episode threads are opened automatically by YALBot after each broadcast.</span>
            ) : (
              <Link href={account ? `/forum/new?board=${slug}` : `/login?next=${encodeURIComponent(`/forum/new?board=${slug}`)}`} className="btn primary">
                New Topic
              </Link>
            )}
            <span className="spacer" />
            <Link href="/forum" className="btn">
              All Boards
            </Link>
          </div>
          <Pagination page={page} pages={pages} href={(p) => `/forum/board/${slug}?page=${p}`} />
          <div className="box" style={{ borderTop: "none" }}>
            <table className="yal-table forum-table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th className="num">Replies</th>
                  <th className="num">Views</th>
                  <th>Last Post</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((t) => (
                  <tr key={t.thread.id}>
                    <td className="topic">
                      {t.thread.pinned && <span className="tag teal">Sticky</span>} {t.thread.locked && <span className="tag mod">Locked</span>}{" "}
                      <Link className="title" href={`/forum/thread/${t.thread.id}`}>
                        {t.thread.title}
                      </Link>
                      <span className="sub">
                        {t.thread.postsRecovered === false ? (
                          <>Subthread &middot; posts not recovered</>
                        ) : (
                          <>
                            Started by {t.thread.author} &middot; {formatDate(t.thread.createdAt)}
                          </>
                        )}
                      </span>
                    </td>
                    <td className="num">{fmtNum(t.archivedReplies ?? (t.snapshot && t.thread.origin === "archive" ? t.snapshot.replies : t.replies))}</td>
                    <td className="num">{t.views !== null ? fmtNum(t.views) : <NA>-</NA>}</td>
                    <td className="last">
                      {t.last && t.thread.postsRecovered !== false ? (
                        <>
                          {relativeTo(t.last.at, asOf)}
                          <br />
                          by <Link href={`/profile/${encodeURIComponent(t.last.author)}`}>{t.last.author}</Link>
                        </>
                      ) : (
                        <NA>-</NA>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shown.length === 0 && <div className="empty">No topics in this board at this point in time.</div>}
          </div>
          <Pagination page={page} pages={pages} href={(p) => `/forum/board/${slug}?page=${p}`} bottom />
        </main>
      </div>
    </>
  );
}
