import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BBCode } from "@/components/BBCode";
import { ArchiveNote, Avatar, NA, fmtNum } from "@/components/ui";
import { toggleFriendAction } from "@/app/actions/profile";
import { findMember, memberJoinsLater, memberList } from "@/lib/members";
import { archivePostsByMember } from "@/lib/archive";
import { getThread, memberPostsByAccount } from "@/lib/forum";
import { reviewsFor } from "@/lib/reviews";
import { animeUrl, characterUrl, getAnime, getCharacter, getManga, getPerson, mangaUrl, personUrl } from "@/lib/catalog";
import { getStore } from "@/lib/store";
import { getViewer } from "@/lib/viewer";
import { excerpt } from "@/lib/bbcode";
import { LIST_STATUSES } from "@/lib/store/types";
import { formatDate, formatLongDate, ms, relativeTo } from "@/lib/time";

export async function generateMetadata(props: PageProps<"/profile/[name]">): Promise<Metadata> {
  const { name } = await props.params;
  return { title: `${decodeURIComponent(name)}'s Profile` };
}

export default async function ProfilePage(props: PageProps<"/profile/[name]">) {
  const { name: raw } = await props.params;
  const sp = await props.searchParams;
  const name = decodeURIComponent(raw);
  const viewer = await getViewer();
  const { asOf } = viewer;
  const member = await findMember(name, asOf);
  if (!member) {
    const later = await memberJoinsLater(name, asOf);
    if (!later) notFound();
    return (
      <>
        <Breadcrumb items={[{ label: "Community", href: "/community" }, { label: "Members", href: "/users" }, { label: name }]} />
        <div className="page single">
          <main>
            <div className="box">
              <div className="box-head">This member hasn&apos;t joined yet</div>
              <div className="box-body">
                <p>There is no member called {name} at this point in time.</p>
                <p className="hint">They join YourAnimeList in {formatDate(later)}.</p>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  const isMe = viewer.account?.username.toLowerCase() === member.name.toLowerCase();
  const list = await memberList(member, asOf);
  const counts = Object.fromEntries(LIST_STATUSES.map((s) => [s, list.filter((e) => e.status === s).length]));
  const scored = list.filter((e) => e.score !== null);
  const mean = scored.length ? (scored.reduce((n, e) => n + e.score!, 0) / scored.length).toFixed(2) : null;
  const episodes = list.reduce((n, e) => n + e.episodesWatched, 0);

  const archivePosts = archivePostsByMember(member.name, asOf).slice(0, 8);
  const ownPosts = member.account ? await memberPostsByAccount(member.account.id, asOf) : [];
  const ownPostDisplay = await Promise.all(
    ownPosts.slice(0, 8).map(async (p) => ({ key: `m-${p.id}`, threadId: p.threadId, number: p.number, at: p.postedAt, body: p.body, title: (await getThread(p.threadId, asOf))?.title ?? "Topic" })),
  );
  const archiveDisplay = await Promise.all(
    archivePosts.map(async (p) => ({ key: p.key, threadId: p.threadId, number: p.number, at: p.at, body: p.body, title: (await getThread(p.threadId, asOf))?.title ?? "Topic" })),
  );
  const posts = [...ownPostDisplay, ...archiveDisplay].sort((a, b) => ms(b.at) - ms(a.at)).slice(0, 8);
  const reviews = (await reviewsFor(asOf)).filter((r) => r.author.toLowerCase() === member.name.toLowerCase());
  const store = getStore();
  const friends = member.account ? (await store.listFriends(member.account.id)).filter((f) => ms(f.since) <= ms(asOf)) : [];
  const myFriends = viewer.account && !isMe ? await store.listFriends(viewer.account.id) : [];
  const isFriend = myFriends.some((f) => f.friendName.toLowerCase() === member.name.toLowerCase());
  const fav = member.account?.favorites;

  const activity = [
    ...list.filter((e) => !e.derived).map((e) => ({ at: e.updatedAt, text: `${e.status === "Plan to Watch" ? "Plans to watch" : e.status} ${getAnime(e.animeId, asOf)?.title ?? ""}`, href: (() => { const a = getAnime(e.animeId, asOf); return a ? animeUrl(a) : "/anime"; })() })),
    ...posts.map((p) => ({ at: p.at, text: `Posted in ${p.title}`, href: `/forum/thread/${p.threadId}#p${p.number}` })),
    ...reviews.map((r) => ({ at: r.postedAt, text: `Reviewed ${getAnime(r.animeId, asOf)?.title ?? ""}`, href: (() => { const a = getAnime(r.animeId, asOf); return a ? animeUrl(a, "reviews") : "/reviews"; })() })),
  ]
    .sort((a, b) => ms(b.at) - ms(a.at))
    .slice(0, 10);

  return (
    <>
      <Breadcrumb items={[{ label: "Community", href: "/community" }, { label: "Members", href: "/users" }, { label: member.name }]} />
      <div className="page left-side">
        <aside className="sidebar">
          <div className="side-card">
            <div className="side-body center">
              <Avatar id={member.avatar} className="avatar profile-avatar" label={`${member.name}'s avatar`} />
              <div className={`username${member.moderator ? " mod" : ""}`} style={{ fontSize: 15 }}>
                {member.name}
              </div>
              <div className={`rank${member.moderator ? " mod-rank" : ""}`}>{member.rank}</div>
              <div className="info-list" style={{ textAlign: "left" }}>
                <div className="row">
                  <span className="k">Joined:</span>
                  {member.joinedAt ? (member.kind === "account" ? formatLongDate(member.joinedAt) : member.joinedLabel) : <NA>Unknown</NA>}
                </div>
                <div className="row">
                  <span className="k">Forum posts:</span>
                  {member.postCount !== null ? fmtNum(member.postCount) : <NA>Not recorded</NA>}
                </div>
                {member.account?.location && (
                  <div className="row">
                    <span className="k">Location:</span>
                    {member.account.location}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="list-actions">
            <Link href={`/animelist/${encodeURIComponent(member.name)}`} className="btn primary">
              Anime List
            </Link>
            {isMe ? (
              <Link href="/panel" className="btn">
                Edit Profile
              </Link>
            ) : viewer.account ? (
              <form action={toggleFriendAction} style={{ display: "grid" }}>
                <input type="hidden" name="name" value={member.name} />
                <input type="hidden" name="on" value={isFriend ? "0" : "1"} />
                <button type="submit" className="btn">
                  {isFriend ? "Remove Friend" : "Add Friend"}
                </button>
              </form>
            ) : null}
          </div>
          <div className="side-card">
            <div className="side-head">Friends ({friends.length})</div>
            <div className="side-body">
              {friends.length ? (
                <ul>
                  {friends.map((f) => (
                    <li key={f.friendName}>
                      <Link href={`/profile/${encodeURIComponent(f.friendName)}`}>{f.friendName}</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <NA>No friends yet.</NA>
              )}
            </div>
          </div>
        </aside>
        <main>
          {sp.welcome && isMe && (
            <div className="notice ok">
              Welcome to YourAnimeList, {member.name}! Start by adding anime to your list, or say hi in the <Link href="/forum">forums</Link>.
            </div>
          )}
          <div className="page-title">
            <h1>{member.name}&apos;s Profile</h1>
          </div>

          {member.account?.about && (
            <div className="box">
              <div className="box-head">About Me</div>
              <div className="box-body post-content">
                <BBCode body={member.account.about} />
              </div>
            </div>
          )}

          <div className="box">
            <div className="box-head">
              Anime Stats
              <Link href={`/animelist/${encodeURIComponent(member.name)}`} className="more">
                View list
              </Link>
            </div>
            <div className="box-body">
              <div className="stat-grid">
                {LIST_STATUSES.map((s) => (
                  <div className="stat-tile" key={s}>
                    {s}
                    <b>{counts[s]}</b>
                  </div>
                ))}
                <div className="stat-tile">
                  Episodes
                  <b>{fmtNum(episodes)}</b>
                </div>
                <div className="stat-tile">
                  Mean score
                  <b>{mean ?? "-"}</b>
                </div>
              </div>
              {list.some((e) => e.derived) && (
                <ArchiveNote>This member&apos;s list was not recovered. Entries shown are derived from their posts in episode discussions.</ArchiveNote>
              )}
            </div>
          </div>

          <div className="box">
            <div className="box-head">Favorites</div>
            <div className="box-body">
              {fav && (fav.anime.length || fav.manga.length || fav.characters.length || fav.people.length) ? (
                <div className="two-col">
                  {(
                    [
                      ["Anime", fav.anime.map((id) => getAnime(id, asOf)).filter(Boolean).map((a) => ({ label: a!.title, href: animeUrl(a!) }))],
                      ["Manga", fav.manga.map((id) => getManga(id, asOf)).filter(Boolean).map((m) => ({ label: m!.title, href: mangaUrl(m!) }))],
                      ["Characters", fav.characters.map((id) => getCharacter(id, asOf)).filter(Boolean).map((c) => ({ label: c!.name, href: characterUrl(c!) }))],
                      ["People", fav.people.map((id) => getPerson(id, asOf)).filter(Boolean).map((p) => ({ label: p!.name, href: personUrl(p!) }))],
                    ] as const
                  ).map(([label, items]) => (
                    <div key={label}>
                      <b>{label}</b>
                      {items.length ? (
                        <ul className="bb-list">
                          {items.map((i) => (
                            <li key={i.href}>
                              <Link href={i.href}>{i.label}</Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="small">
                          <NA>None</NA>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <NA>No favorites yet.</NA>
              )}
            </div>
          </div>

          <div className="box">
            <div className="box-head">Recent Activity</div>
            {activity.length ? (
              <table className="yal-table">
                <tbody>
                  {activity.map((a, i) => (
                    <tr key={`${a.href}-${i}`}>
                      <td>
                        <Link href={a.href}>{a.text}</Link>
                      </td>
                      <td className="muted small" style={{ whiteSpace: "nowrap" }}>
                        {relativeTo(a.at, asOf)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">No activity yet.</div>
            )}
          </div>

          <div className="box">
            <div className="box-head">Recent Forum Posts</div>
            {posts.length ? (
              <table className="yal-table">
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.key}>
                      <td>
                        <Link href={`/forum/thread/${p.threadId}#p${p.number}`}>{p.title}</Link>
                        <span className="sub">{excerpt(p.body, 140)}</span>
                      </td>
                      <td className="muted small" style={{ whiteSpace: "nowrap" }}>
                        {formatDate(p.at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">No forum posts yet.</div>
            )}
          </div>

          {reviews.length > 0 && (
            <div className="box">
              <div className="box-head">Reviews</div>
              <table className="yal-table">
                <tbody>
                  {reviews.map((r) => {
                    const a = getAnime(r.animeId, asOf);
                    return (
                      <tr key={r.id}>
                        <td>{a ? <Link href={animeUrl(a, "reviews")}>{a.title}</Link> : "Anime"}</td>
                        <td className="num">{r.overall}/10</td>
                        <td className="muted small">{formatDate(r.postedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {member.kind === "archive" && <ArchiveNote>Profile assembled from recovered forum records: avatar, rank, join month and post counts as they appeared in archived posts.</ArchiveNote>}
        </main>
      </div>
    </>
  );
}
