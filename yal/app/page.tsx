import Link from "next/link";
import { Avatar, Cover, NA, fmtNum } from "@/components/ui";
import { animeStatus, animeUrl, latestScore, newsUrl, nextEpisodeSlot, seasonalAnime, visibleAnime, visibleNews } from "@/lib/catalog";
import { recentForumPosts, boardThreads } from "@/lib/forum";
import { reviewsFor } from "@/lib/reviews";
import { visibleMembers } from "@/lib/members";
import { excerpt } from "@/lib/bbcode";
import { getViewer } from "@/lib/viewer";
import { formatAirDate, formatBroadcastSlot, formatDate, formatLongDate, ms, relativeTo, seasonLabel, seasonOf } from "@/lib/time";

export default async function Home() {
  const viewer = await getViewer();
  const { asOf } = viewer;
  const season = seasonOf(asOf);
  const { premiering, continuing } = seasonalAnime(season.year, season.season, asOf);
  const news = visibleNews(asOf).slice(0, 4);
  const posts = await recentForumPosts(asOf, 8);
  const reviews = (await reviewsFor(asOf)).slice(0, 3);
  const members = await visibleMembers(asOf);
  const newest = [...members].sort((a, b) => ms(b.joinedAt ?? "2000-01-01") - ms(a.joinedAt ?? "2000-01-01")).slice(0, 6);
  const hot = (await boardThreads(null, asOf))
    .filter((t) => t.last && ms(asOf) - ms(t.last.at) < 7 * 86400_000 && t.thread.postsRecovered !== false)
    .slice(0, 6);
  const airing = visibleAnime(asOf).filter((a) => animeStatus(a, asOf) === "Currently Airing" && a.type === "TV");
  const upcoming = airing.map((a) => ({ a, next: nextEpisodeSlot(a, asOf) })).filter((x) => x.next && !x.next.aired);
  const top = visibleAnime(asOf)
    .map((a) => ({ a, s: latestScore(a, asOf) }))
    .filter((x) => x.s)
    .sort((x, y) => y.s!.score - x.s!.score)
    .slice(0, 5);
  const seasonal = [...premiering, ...continuing];

  return (
    <div className="page">
      <main>
        {!viewer.account && (
          <div className="box">
            <div className="box-head">Welcome to YourAnimeList!</div>
            <div className="box-body">
              <p className="mt-0">
                The anime and manga database run by fans. Keep track of what you&apos;re watching, score your favourites, write reviews and
                join thousands of members in the episode discussions.
              </p>
              <Link href="/register" className="btn primary">
                Sign Up
              </Link>{" "}
              <Link href="/login" className="btn">
                Login
              </Link>{" "}
              <span className="hint">It&apos;s free!</span>
            </div>
          </div>
        )}

        <div className="box">
          <div className="box-head">
            {seasonLabel(season.season, season.year)} Anime
            <Link href="/anime/season" className="more">
              View season chart
            </Link>
          </div>
          {seasonal.length ? (
            <div className="season-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
              {seasonal.map((a) => (
                <Link key={a.id} href={animeUrl(a)} className="season-card" style={{ textDecoration: "none" }}>
                  <Cover src={a.cover} title={a.title} />
                  <div style={{ padding: "5px 7px", fontWeight: "bold", fontSize: 12 }}>{a.title}</div>
                  <div style={{ padding: "0 7px 6px", fontSize: 11, color: "var(--muted)" }}>
                    {animeStatus(a, asOf)}
                    {latestScore(a, asOf) && ` · ${latestScore(a, asOf)!.score.toFixed(2)}`}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty">No TV series this season are in the archive yet.</div>
          )}
        </div>

        <div className="box">
          <div className="box-head">
            Anime News
            <Link href="/news" className="more">
              More news
            </Link>
          </div>
          {news.length ? (
            news.map((n) => (
              <div className="news-item" key={n.id}>
                <h3>
                  <Link href={newsUrl(n)}>{n.title}</Link>
                </h3>
                <div className="meta">
                  {formatLongDate(n.publishedAt)} by {n.author}
                </div>
                <div className="news-body small">{excerpt(n.body, 220)}</div>
              </div>
            ))
          ) : (
            <div className="empty">No news yet.</div>
          )}
        </div>

        <div className="box">
          <div className="box-head">
            Latest Forum Posts
            <Link href="/forum" className="more">
              Go to forums
            </Link>
          </div>
          {posts.length ? (
            <table className="yal-table">
              <tbody>
                {posts.map((p) => (
                  <tr key={p.key}>
                    <td style={{ width: 34 }}>
                      <Avatar id={p.avatar} className="avatar xs" />
                    </td>
                    <td>
                      <Link href={`/forum/thread/${p.threadId}?page=last#p${p.number}`}>{p.threadTitle}</Link>
                      <span className="sub">
                        <b>{p.author}</b>: {excerpt(p.body, 110)}
                      </span>
                    </td>
                    <td className="muted small" style={{ whiteSpace: "nowrap" }}>
                      {relativeTo(p.at, asOf)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">The forums are quiet right now.</div>
          )}
        </div>

        <div className="box">
          <div className="box-head">
            Latest Reviews
            <Link href="/reviews" className="more">
              More reviews
            </Link>
          </div>
          {reviews.length ? (
            reviews.map((r) => {
              const a = visibleAnime(asOf).find((x) => x.id === r.animeId)!;
              return (
                <div className="news-item" key={r.id}>
                  <h3>
                    <Link href={animeUrl(a, "reviews")}>{a.title}</Link> <span className="muted small">({r.overall}/10)</span>
                  </h3>
                  <div className="meta">
                    by {r.author} &middot; {formatDate(r.postedAt)}
                  </div>
                  <div className="news-body small">{excerpt(r.body, 200)}</div>
                </div>
              );
            })
          ) : (
            <div className="empty">No reviews yet.</div>
          )}
        </div>
      </main>

      <aside className="sidebar">
        {upcoming.length > 0 && (
          <div className="side-card">
            <div className="side-head">Airing Next</div>
            <div className="side-body">
              <ul>
                {upcoming.map(({ a, next }) => (
                  <li key={a.id}>
                    <Link href={animeUrl(a, "episodes")}>{a.title}</Link> Ep {next!.number}
                    <br />
                    <span className="muted">
                      {formatAirDate(next!.at)} ({formatBroadcastSlot(next!.at).weekday.slice(0, 3)} {formatBroadcastSlot(next!.at).time} JST)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <div className="side-card">
          <div className="side-head">Hot Topics</div>
          <div className="side-body">
            {hot.length ? (
              <ul>
                {hot.map((t) => (
                  <li key={t.thread.id}>
                    <Link href={`/forum/thread/${t.thread.id}`}>{t.thread.title}</Link>{" "}
                    <span className="muted">({fmtNum(t.snapshot && t.thread.origin === "archive" ? t.snapshot.replies : t.replies)})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <NA>No recent activity this week.</NA>
            )}
          </div>
        </div>
        <div className="side-card">
          <div className="side-head">Top Anime</div>
          <div className="side-body">
            {top.length ? (
              <ul>
                {top.map(({ a, s }) => (
                  <li key={a.id}>
                    <Link href={animeUrl(a)}>{a.title}</Link> <span className="muted">{s!.score.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <NA>Not enough scores yet.</NA>
            )}
            <div style={{ marginTop: 6 }}>
              <Link href="/topanime" className="small">
                Full ranking &raquo;
              </Link>
            </div>
          </div>
        </div>
        <div className="side-card">
          <div className="side-head">Newest Members</div>
          <div className="side-body">
            <div className="viewers-summary">
              <b>{fmtNum(members.length)}</b> members
            </div>
            <div className="viewers-list">
              {newest.map((m, i) => (
                <span key={m.name}>
                  {i > 0 && ", "}
                  <Link href={`/profile/${encodeURIComponent(m.name)}`}>{m.name}</Link>
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
