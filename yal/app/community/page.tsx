import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle, SectionNav } from "@/components/SectionNav";
import { Avatar, fmtNum } from "@/components/ui";
import { recentForumPosts } from "@/lib/forum";
import { visibleMembers } from "@/lib/members";
import { recommendationsFor, reviewsFor } from "@/lib/reviews";
import { animeUrl, getAnime, newsUrl, visibleNews } from "@/lib/catalog";
import { excerpt } from "@/lib/bbcode";
import { getViewer } from "@/lib/viewer";
import { ms, relativeTo } from "@/lib/time";

export const metadata: Metadata = { title: "Community" };

type Activity = { at: string; who: string; avatar: string; text: React.ReactNode; key: string };

export default async function CommunityPage() {
  const { asOf } = await getViewer();
  const posts = await recentForumPosts(asOf, 25);
  const reviews = (await reviewsFor(asOf)).slice(0, 10);
  const recs = (await recommendationsFor(asOf)).slice(0, 10);
  const members = await visibleMembers(asOf);
  const joins = members.filter((m) => m.joinedAt && ms(m.joinedAt) <= ms(asOf)).sort((a, b) => ms(b.joinedAt!) - ms(a.joinedAt!)).slice(0, 10);
  const news = visibleNews(asOf).slice(0, 5);

  const feed: Activity[] = [
    ...posts.map((p) => ({
      at: p.at,
      who: p.author,
      avatar: p.avatar,
      key: p.key,
      text: (
        <>
          posted in <Link href={`/forum/thread/${p.threadId}?page=last#p${p.number}`}>{p.threadTitle}</Link>
          <span className="sub">{excerpt(p.body, 120)}</span>
        </>
      ),
    })),
    ...reviews.map((r) => {
      const a = getAnime(r.animeId, asOf)!;
      return {
        at: r.postedAt,
        who: r.author,
        avatar: r.avatar,
        key: `rv-${r.id}`,
        text: (
          <>
            reviewed <Link href={animeUrl(a, "reviews")}>{a.title}</Link> ({r.overall}/10)
          </>
        ),
      };
    }),
    ...recs.map((r) => {
      const from = getAnime(r.fromId, asOf)!;
      const to = getAnime(r.toId, asOf)!;
      return {
        at: r.postedAt,
        who: r.author,
        avatar: "av-default",
        key: `rec-${r.id}`,
        text: (
          <>
            recommended <Link href={animeUrl(to)}>{to.title}</Link> to fans of <Link href={animeUrl(from)}>{from.title}</Link>
          </>
        ),
      };
    }),
  ]
    .sort((a, b) => ms(b.at) - ms(a.at))
    .slice(0, 30);

  return (
    <>
      <Breadcrumb items={[{ label: "Community" }]} />
      <div className="page">
        <main>
          <PageTitle title="Community" attached />
          <SectionNav section="community" active="/community" />
          <div className="box" style={{ borderTop: "none" }}>
            <div className="box-head warm">Recent Community Activity</div>
            <table className="yal-table">
              <tbody>
                {feed.map((f) => (
                  <tr key={f.key}>
                    <td style={{ width: 34 }}>
                      <Avatar id={f.avatar} className="avatar xs" />
                    </td>
                    <td>
                      <Link href={`/profile/${encodeURIComponent(f.who)}`}>
                        <b>{f.who}</b>
                      </Link>{" "}
                      {f.text}
                    </td>
                    <td className="muted small" style={{ whiteSpace: "nowrap" }}>
                      {relativeTo(f.at, asOf)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {feed.length === 0 && <div className="empty">It&apos;s quiet here at this point in time.</div>}
          </div>
        </main>
        <aside className="sidebar">
          <div className="side-card">
            <div className="side-head">Community Stats</div>
            <div className="side-body">
              <table>
                <tbody>
                  <tr>
                    <td className="k">Members</td>
                    <td>{fmtNum(members.length)}</td>
                  </tr>
                </tbody>
              </table>
              <Link href="/stats" className="small">
                Site statistics &raquo;
              </Link>
            </div>
          </div>
          <div className="side-card">
            <div className="side-head">Newest Members</div>
            <div className="side-body">
              <ul>
                {joins.map((m) => (
                  <li key={m.name}>
                    <Link href={`/profile/${encodeURIComponent(m.name)}`}>{m.name}</Link> <span className="muted">({m.joinedLabel})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="side-card">
            <div className="side-head">Latest News</div>
            <div className="side-body">
              <ul>
                {news.map((n) => (
                  <li key={n.id}>
                    <Link href={newsUrl(n)}>{n.title}</Link>
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
