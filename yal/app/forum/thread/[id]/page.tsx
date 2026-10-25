import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb, type Crumb } from "@/components/Breadcrumb";
import { PostView } from "@/components/forum/PostView";
import { ReplyBox } from "@/components/forum/ReplyBox";
import { SortSelect } from "@/components/forum/SortSelect";
import { ArchiveNote, Pagination, fmtNum } from "@/components/ui";
import { toggleFollowAction } from "@/app/actions/forum";
import { getViewer } from "@/lib/viewer";
import { getThread, summarize, threadExistsLater, threadPosts } from "@/lib/forum";
import { episodeThread, getBoard, getArchiveThread, threadVisible } from "@/lib/archive";
import { animeUrl, getAnime, nextEpisodeSlot } from "@/lib/catalog";
import { quoteFor } from "@/lib/bbcode";
import { formatDate, formatDateTime, happened, ms } from "@/lib/time";
import { getStore } from "@/lib/store";

const PER_PAGE = 20;

export async function generateMetadata(props: PageProps<"/forum/thread/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const t = getArchiveThread(id);
  return { title: t?.title ?? "Forum Topic" };
}

export default async function ThreadPage(props: PageProps<"/forum/thread/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const viewer = await getViewer();
  const { asOf } = viewer;
  const thread = await getThread(id, asOf);

  if (!thread) {
    const later = await threadExistsLater(id, asOf);
    if (!later) notFound();
    return (
      <>
        <Breadcrumb items={[{ label: "Forums", href: "/forum" }, { label: "Topic not found" }]} />
        <div className="page single">
          <main>
            <div className="box">
              <div className="box-head">This topic does not exist yet</div>
              <div className="box-body">
                <p>The topic you are looking for has not been created at this point in time.</p>
                <p className="hint">It is opened on {formatDateTime(later)}. Use the archive toolbar above to travel forward.</p>
                <p>
                  <Link href="/forum" className="btn">
                    &laquo; Back to Forums
                  </Link>
                </p>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  const sort = sp.sort === "newest" ? "newest" : "oldest";
  const allPosts = await threadPosts(thread.id, asOf, viewer.account?.id);
  const ordered = sort === "newest" ? [...allPosts].reverse() : allPosts;
  const pages = Math.max(1, Math.ceil(ordered.length / PER_PAGE));
  const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = rawPage === "last" ? pages : Math.min(Math.max(1, Number(rawPage) || 1), pages);
  const shown = ordered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const summary = await summarize(thread, asOf);
  const snapshot = summary.snapshot;

  const anime = thread.animeId ? getAnime(thread.animeId, asOf) : null;
  const board = getBoard(thread.board);
  const isEpisode = thread.episode !== undefined && !thread.parentThreadId && anime;
  const base = `/forum/thread/${thread.id}`;
  const pageHref = (p: number) => `${base}?page=${p}${sort === "newest" ? "&sort=newest" : ""}`;

  const quoteParam = Array.isArray(sp.quote) ? sp.quote[0] : sp.quote;
  const quoted = quoteParam ? allPosts.find((p) => p.number === Number(quoteParam)) : undefined;
  const initialReply = quoted ? quoteFor(quoted.author, quoted.number, quoted.body) : "";

  const following = viewer.account ? (await getStore().listFollows(viewer.account.id)).includes(thread.id) : false;
  const canPost = Boolean(viewer.account) && !thread.locked;

  // Reply totals: the archive snapshot is authoritative once captured;
  // member replies made after it are added on top. Before the capture the
  // count is simply the posts that existed.
  const memberReplies = allPosts.filter((p) => p.origin === "member").length;
  const replies = snapshot && thread.origin === "archive" ? snapshot.replies + memberReplies : summary.archivedReplies ?? summary.replies;
  const last = summary.last;

  const crumbs: Crumb[] = isEpisode
    ? [
        { label: "Anime", href: "/anime" },
        { label: `${anime.title} (${anime.year ?? "?"})`, href: animeUrl(anime) },
        { label: "Episodes", href: animeUrl(anime, "episodes") },
        { label: `Episode ${thread.episode} Discussion` },
      ]
    : [{ label: "Forums", href: "/forum" }, { label: board?.name ?? "Board", href: `/forum/board/${thread.board}` }, { label: thread.title }];

  // Other episode discussions that exist at this moment.
  const otherEpisodes = anime
    ? anime.episodeList
        .map((e) => ({ e, t: episodeThread(anime.id, e.number) }))
        .filter((x) => x.t && threadVisible(x.t, asOf))
    : [];
  const otherCounts = await Promise.all(
    otherEpisodes.map(async (x) => {
      const s = await summarize({ ...x.t!, origin: "archive" }, asOf);
      return s.snapshot ? s.snapshot.replies : s.replies;
    }),
  );
  const next = anime ? nextEpisodeSlot(anime, asOf) : null;
  const episodeTitle = isEpisode ? anime.episodeList.find((e) => e.number === thread.episode)?.title ?? null : null;

  // Members active in the last hour before the viewed moment.
  const recentlyActive = [...new Set(allPosts.filter((p) => ms(asOf) - ms(p.at) <= 3600_000 && happened(p.at, asOf)).map((p) => p.author))];
  const parent = thread.parentThreadId ? getArchiveThread(thread.parentThreadId) : null;

  return (
    <>
      <Breadcrumb items={crumbs} />
      <div className="page">
        <main>
          <div className="thread-card" data-provenance={thread.provenance}>
            <div className="thread-title-bar">
              <h1>{thread.title}</h1>
              <div className="subtype">
                Forum &raquo; {board?.group === "Anime & Manga" ? "Anime Discussion" : board?.group ?? "Forum"} &raquo; {board?.name}
              </div>
            </div>
            <table className="thread-meta">
              <tbody>
                <tr>
                  <td className="label">Started by</td>
                  <td>
                    {thread.postsRecovered === false ? (
                      <span className="na">Not recovered</span>
                    ) : (
                      <>
                        <Link href={`/profile/${encodeURIComponent(thread.author)}`} className={`username${thread.author === "YALBot" ? " mod" : ""}`}>
                          {thread.author}
                        </Link>{" "}
                        {thread.author === "YALBot" && <span className="rank mod-rank">Moderator</span>}
                      </>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="label">Created</td>
                  <td>{thread.postsRecovered === false ? <span className="na">Not recovered (listed in the {formatDate(thread.createdAt)} archive)</span> : formatDateTime(thread.createdAt, thread.createdTz ?? "JST")}</td>
                </tr>
                <tr>
                  <td className="label">Replies</td>
                  <td>
                    <b>{fmtNum(replies)}</b>
                  </td>
                </tr>
                <tr>
                  <td className="label">Views</td>
                  <td>
                    {summary.views !== null ? (
                      <b>{fmtNum(summary.views)}</b>
                    ) : (
                      <span className="na" title="View counts were only captured in archive snapshots.">
                        Not recorded for this date
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="label">Last Reply</td>
                  <td>
                    {snapshot && thread.origin === "archive" && memberReplies === 0 && thread.postsRecovered ? (
                      <>
                        {formatDateTime(snapshot.lastReplyAt)} &mdash; by{" "}
                        <Link href={`/profile/${encodeURIComponent(snapshot.lastReplyBy)}`}>{snapshot.lastReplyBy}</Link>
                      </>
                    ) : last && thread.postsRecovered !== false ? (
                      <>
                        {formatDateTime(last.at)} &mdash; by <Link href={`/profile/${encodeURIComponent(last.author)}`}>{last.author}</Link>
                      </>
                    ) : (
                      <span className="na">N/A</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="label">Status</td>
                  <td>
                    <span className="status-open">{thread.locked ? "Locked" : "Open"}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="controls">
            {canPost ? (
              <a href="#reply" className="btn primary">
                Reply
              </a>
            ) : (
              <Link href={viewer.account ? "#reply" : `/login?next=${encodeURIComponent(base)}`} className="btn primary">
                Reply
              </Link>
            )}
            <form action={toggleFollowAction} className="inline-form">
              <input type="hidden" name="threadId" value={thread.id} />
              <input type="hidden" name="follow" value={following ? "0" : "1"} />
              <button type="submit" className="btn">
                {following ? "Unfollow Topic" : "Follow Topic"}
              </button>
            </form>
            {isEpisode && (
              <>
                <Link href={`${animeUrl(anime, "episodes")}/${thread.episode}`} className="btn">
                  Watch Episode
                </Link>
                <Link href={animeUrl(anime)} className="btn">
                  Anime Page
                </Link>
                <Link href={animeUrl(anime, "episodes")} className="btn">
                  Episode List
                </Link>
                {otherEpisodes
                  .filter((x) => x.e.number !== thread.episode)
                  .map((x) => (
                    <Link key={x.e.number} href={`/forum/thread/${x.t!.id}`} className="btn">
                      Episode {x.e.number} Discussion
                    </Link>
                  ))}
              </>
            )}
            {!isEpisode && (
              <Link href={`/forum/board/${thread.board}`} className="btn">
                Back to Board
              </Link>
            )}
            <span className="spacer" />
            <SortSelect base={base} sort={sort} />
          </div>

          <Pagination page={page} pages={pages} href={pageHref} />

          <div className="posts">
            {shown.length === 0 && (
              <div className="empty">
                {thread.postsRecovered === false ? (
                  <>
                    The posts in this subthread were not recovered by the archive. The {formatDate(snapshot?.capturedAt ?? thread.createdAt)} snapshot lists{" "}
                    {fmtNum(summary.archivedReplies ?? 0)} replies.
                    {parent && (
                      <>
                        {" "}
                        Continue the discussion in <Link href={`/forum/thread/${parent.id}`}>{parent.title}</Link>, or start it again below.
                      </>
                    )}
                  </>
                ) : (
                  "No posts yet."
                )}
              </div>
            )}
            {shown.map((p) => (
              <PostView
                key={p.key}
                post={p}
                mine={Boolean(viewer.account && p.accountId === viewer.account.id)}
                quoteHref={`${pageHref(page)}&quote=${p.number}#reply`}
                reportHref={`/forum/report?thread=${encodeURIComponent(thread.id)}&post=${encodeURIComponent(p.key)}`}
                canReply={canPost}
              />
            ))}
          </div>

          <Pagination page={page} pages={pages} href={pageHref} bottom />

          {canPost ? (
            <ReplyBox key={quoteParam ?? "none"} threadId={thread.id} initial={initialReply} />
          ) : (
            <div className="reply-box" id="reply">
              <div className="reply-box-head">Post a Reply</div>
              <div className="reply-box-body">
                {thread.locked ? (
                  <p className="mt-0">This topic is locked.</p>
                ) : (
                  <p className="mt-0">
                    You must be logged in to reply. <Link href={`/login?next=${encodeURIComponent(base)}`}>Login</Link> or{" "}
                    <Link href="/register">Sign Up</Link> &mdash; it&apos;s free!
                  </p>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: 10, textAlign: "right" }}>
            {anime ? (
              <Link href={animeUrl(anime)} className="btn">
                &laquo; Back to Anime Page
              </Link>
            ) : (
              <Link href={`/forum/board/${thread.board}`} className="btn">
                &laquo; Back to {board?.name}
              </Link>
            )}
          </div>
        </main>

        <aside className="sidebar">
          {thread.sidebar?.poll && (
            <div className="side-card">
              <div className="side-head">Episode {thread.episode} Poll</div>
              <div className="side-body">
                <div className="poll-question">
                  <b>{thread.sidebar.poll.question}</b>
                </div>
                {snapshot ? (
                  <>
                    <div className="poll-total">{fmtNum(thread.sidebar.poll.totalVotes)} votes total</div>
                    {thread.sidebar.poll.options.map((o) => (
                      <div className="poll-row" key={o.label}>
                        <div className="poll-label">
                          <span>{o.label}</span>
                          <span>{o.percent}%</span>
                        </div>
                        <div className="poll-bar">
                          <div className="fill" style={{ width: `${o.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="poll-total">Results were archived on {formatDate(thread.snapshot!.capturedAt)}.</div>
                )}
              </div>
            </div>
          )}

          <div className="side-card">
            <div className="side-head">{isEpisode ? "Episode Discussion" : "Thread Info"}</div>
            <div className="side-body">
              <table>
                <tbody>
                  {anime && !isEpisode && (
                    <tr>
                      <td className="k">Anime</td>
                      <td>
                        <Link href={animeUrl(anime)}>
                          {anime.title} ({anime.year ?? "?"})
                        </Link>
                      </td>
                    </tr>
                  )}
                  {thread.episode !== undefined && (
                    <tr>
                      <td className="k">Episode</td>
                      <td>
                        <b>Episode {thread.episode}</b>
                      </td>
                    </tr>
                  )}
                  {episodeTitle && (
                    <tr>
                      <td className="k">Title</td>
                      <td>{episodeTitle}</td>
                    </tr>
                  )}
                  {!isEpisode && (
                    <tr>
                      <td className="k">Board</td>
                      <td>
                        <Link href={`/forum/board/${thread.board}`}>{board?.name}</Link>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="k">Replies</td>
                    <td>{fmtNum(replies)}</td>
                  </tr>
                  <tr>
                    <td className="k">Views</td>
                    <td>{summary.views !== null ? fmtNum(summary.views) : <span className="na">N/A</span>}</td>
                  </tr>
                  <tr>
                    <td className="k">Created</td>
                    <td>{thread.postsRecovered === false ? <span className="na">Not recovered</span> : formatDate(thread.createdAt)}</td>
                  </tr>
                  <tr>
                    <td className="k">Last Reply</td>
                    <td>{last ? formatDate(last.at) : <span className="na">N/A</span>}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {anime && (
            <div className="side-card">
              <div className="side-head">Quick Links</div>
              <div className="side-body">
                <ul>
                  <li>
                    <Link href={animeUrl(anime)}>Anime Page</Link>
                  </li>
                  <li>
                    <Link href={animeUrl(anime, "episodes")}>Episode List</Link>
                  </li>
                  <li>
                    <Link href={animeUrl(anime, "characters")}>Characters</Link>
                  </li>
                  <li>
                    <Link href={animeUrl(anime, "reviews")}>Reviews</Link>
                  </li>
                  <li>
                    <Link href={animeUrl(anime, "pics")}>Pictures</Link>
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div className="side-card">
            <div className="side-head">Active Users Viewing</div>
            <div className="side-body">
              {snapshot && thread.sidebar?.viewers ? (
                <>
                  <div className="viewers-summary">
                    <b>{thread.sidebar.viewers.total}</b> users
                    <br />
                    {thread.sidebar.viewers.members} members &middot; {thread.sidebar.viewers.guests} guests
                  </div>
                  <div className="viewers-list">
                    {thread.sidebar.viewers.names.map((n, i) => (
                      <span key={n}>
                        {i > 0 && ", "}
                        <Link href={`/profile/${encodeURIComponent(n)}`}>{n}</Link>
                      </span>
                    ))}
                  </div>
                  <div className="hint" style={{ marginTop: 6 }}>
                    As captured {formatDate(snapshot.capturedAt)}.
                  </div>
                </>
              ) : (
                <>
                  <div className="viewers-summary">
                    <b>{recentlyActive.length}</b> member{recentlyActive.length === 1 ? "" : "s"} posted in the last hour
                  </div>
                  {recentlyActive.length > 0 && (
                    <div className="viewers-list">
                      {recentlyActive.map((n, i) => (
                        <span key={n}>
                          {i > 0 && ", "}
                          <Link href={`/profile/${encodeURIComponent(n)}`}>{n}</Link>
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {snapshot && thread.sidebar?.hotSubthreads && thread.sidebar.hotSubthreads.length > 0 && (
            <div className="side-card">
              <div className="side-head">Hot Subthreads (this episode)</div>
              <div className="side-body">
                <ul>
                  {thread.sidebar.hotSubthreads.map((s) => (
                    <li key={s.title}>
                      <Link href={`/forum/thread/${s.threadId}`}>{s.title}</Link> ({fmtNum(s.replies)} replies)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {isEpisode && (
            <div className="side-card">
              <div className="side-head">Other Episodes</div>
              <div className="side-body">
                <ul>
                  {otherEpisodes.map((x, i) =>
                    x.e.number === thread.episode ? (
                      <li key={x.e.number}>
                        <b>Ep {x.e.number}</b> &mdash; Discussion ({fmtNum(otherCounts[i])})
                      </li>
                    ) : (
                      <li key={x.e.number}>
                        <Link href={`/forum/thread/${x.t!.id}`}>Ep {x.e.number}</Link> &mdash; Discussion ({fmtNum(otherCounts[i])})
                      </li>
                    ),
                  )}
                  {next && !next.aired && <li>Ep {next.number} &mdash; Not aired yet</li>}
                </ul>
              </div>
            </div>
          )}

          {parent && (
            <div className="side-card">
              <div className="side-head">Parent Thread</div>
              <div className="side-body">
                <Link href={`/forum/thread/${parent.id}`}>{parent.title}</Link>
              </div>
            </div>
          )}

          <ArchiveNote>
            {thread.origin === "archive" && thread.postsRecovered !== false && (
              <>Recovered from the YAL archive{thread.snapshot ? ` (snapshot ${formatDate(thread.snapshot.capturedAt)})` : ""}. Counts before the snapshot are live counts of recovered posts.</>
            )}
            {thread.origin === "archive" && thread.postsRecovered === false && <>Listed in the archive snapshot; individual posts were not recovered.</>}
            {thread.origin === "reconstructed" && <>Reconstructed sample thread written for the archive, not a recovered record.</>}
            {thread.origin === "member" && <>Started by a member of this archive.</>}
          </ArchiveNote>
        </aside>
      </div>
    </>
  );
}
