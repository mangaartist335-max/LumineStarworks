import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ArchiveNote, NA } from "@/components/ui";
import { incrementEpisodeAction } from "@/app/actions/list";
import { findMember, memberList } from "@/lib/members";
import { animeUrl, getAnime } from "@/lib/catalog";
import { getViewer } from "@/lib/viewer";
import { LIST_STATUSES, type ListStatus } from "@/lib/store/types";
import { formatDate } from "@/lib/time";

export async function generateMetadata(props: PageProps<"/animelist/[name]">): Promise<Metadata> {
  const { name } = await props.params;
  return { title: `${decodeURIComponent(name)}'s Anime List` };
}

const SLUGS: Record<string, ListStatus> = {
  watching: "Watching",
  completed: "Completed",
  onhold: "On-Hold",
  dropped: "Dropped",
  plantowatch: "Plan to Watch",
};

export default async function AnimeListPage(props: PageProps<"/animelist/[name]">) {
  const { name: raw } = await props.params;
  const sp = await props.searchParams;
  const name = decodeURIComponent(raw);
  const viewer = await getViewer();
  const member = await findMember(name, viewer.asOf);
  if (!member) notFound();
  const isMe = viewer.account?.username.toLowerCase() === member.name.toLowerCase();
  const filterSlug = (Array.isArray(sp.status) ? sp.status[0] : sp.status) ?? "";
  const filter = SLUGS[filterSlug];
  const list = (await memberList(member, viewer.asOf)).filter((e) => getAnime(e.animeId, viewer.asOf));
  const statuses = filter ? [filter] : [...LIST_STATUSES];
  const base = `/animelist/${encodeURIComponent(member.name)}`;

  return (
    <>
      <Breadcrumb items={[{ label: "Community", href: "/community" }, { label: member.name, href: `/profile/${encodeURIComponent(member.name)}` }, { label: "Anime List" }]} />
      <div className="page single">
        <main>
          {sp.updated && isMe && <div className="notice ok">Your list has been updated.</div>}
          <div className="page-title" style={{ marginBottom: 0 }}>
            <h1>{member.name}&apos;s Anime List</h1>
          </div>
          <nav className="list-tabs" aria-label="List status">
            <Link href={base} className={!filter ? "active" : undefined}>
              All Anime
            </Link>
            {Object.entries(SLUGS).map(([slug, label]) => (
              <Link key={slug} href={`${base}?status=${slug}`} className={filter === label ? "active" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="box" style={{ borderTop: "none" }}>
            {statuses.map((status) => {
              const rows = list.filter((e) => e.status === status);
              if (filter === undefined && rows.length === 0) return null;
              return (
                <div key={status}>
                  <div className="list-section-head">
                    {status} ({rows.length})
                  </div>
                  {rows.length ? (
                    <table className="yal-table">
                      <thead>
                        <tr>
                          <th className="num">#</th>
                          <th>Anime Title</th>
                          <th className="num">Score</th>
                          <th className="num">Type</th>
                          <th className="num">Progress</th>
                          {isMe && <th className="num">Edit</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((e, i) => {
                          const a = getAnime(e.animeId, viewer.asOf)!;
                          return (
                            <tr key={e.animeId}>
                              <td className="num">{i + 1}</td>
                              <td>
                                <Link href={animeUrl(a)}>{a.title}</Link>
                                {e.derived && <span className="tag" style={{ marginLeft: 5 }} title="Derived from forum activity">derived</span>}
                                {e.notes && <span className="sub">{e.notes}</span>}
                                {(e.startDate || e.finishDate) && (
                                  <span className="sub">
                                    {e.startDate && `Started ${formatDate(`${e.startDate}T03:00:00Z`)}`}
                                    {e.finishDate && ` · Finished ${formatDate(`${e.finishDate}T03:00:00Z`)}`}
                                  </span>
                                )}
                              </td>
                              <td className="num">{e.score ?? "-"}</td>
                              <td className="num">{a.type}</td>
                              <td className="num">
                                {e.episodesWatched}/{a.episodesPlanned ?? "?"}
                                {isMe && !e.derived && e.status !== "Completed" && (
                                  <form action={incrementEpisodeAction} className="inline-form">
                                    <input type="hidden" name="animeId" value={a.id} />
                                    <button type="submit" className="btn" style={{ padding: "0 5px", marginLeft: 4, fontSize: 10 }} aria-label={`Add one episode to ${a.title}`}>
                                      +
                                    </button>
                                  </form>
                                )}
                              </td>
                              {isMe && (
                                <td className="num">
                                  <Link href={`/ownlist/anime/${a.id}/edit`}>Edit</Link>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty">No anime in this list.</div>
                  )}
                </div>
              );
            })}
            {list.length === 0 && (
              <div className="empty">
                {isMe ? (
                  <>
                    Your list is empty. <Link href="/anime">Browse the anime database</Link> and use &quot;Add to My List&quot;.
                  </>
                ) : (
                  <NA>This list is empty.</NA>
                )}
              </div>
            )}
          </div>
          {list.some((e) => e.derived) && <ArchiveNote>Derived entries come from this member&apos;s posts in episode threads; their full list was not recovered.</ArchiveNote>}
        </main>
      </div>
    </>
  );
}
