import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle, SectionNav } from "@/components/SectionNav";
import { Avatar, Pagination, fmtNum } from "@/components/ui";
import { visibleMembers } from "@/lib/members";
import { getViewer } from "@/lib/viewer";
import { ms } from "@/lib/time";

export const metadata: Metadata = { title: "Members" };

const PER_PAGE = 40;

export default async function UsersPage(props: PageProps<"/users">) {
  const sp = await props.searchParams;
  const { asOf } = await getViewer();
  const q = ((Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "").trim().toLowerCase();
  const sort = (Array.isArray(sp.sort) ? sp.sort[0] : sp.sort) ?? "newest";
  let members = (await visibleMembers(asOf)).filter((m) => !q || m.name.toLowerCase().includes(q));
  members = members.sort((a, b) =>
    sort === "posts" ? (b.postCount ?? 0) - (a.postCount ?? 0) : sort === "name" ? a.name.localeCompare(b.name) : ms(b.joinedAt ?? "2000-01-01") - ms(a.joinedAt ?? "2000-01-01"),
  );
  const pages = Math.max(1, Math.ceil(members.length / PER_PAGE));
  const page = Math.min(Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1), pages);
  const shown = members.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const href = (p: number) => `/users?${new URLSearchParams({ ...(q && { q }), sort, page: String(p) })}`;

  return (
    <>
      <Breadcrumb items={[{ label: "Community", href: "/community" }, { label: "Members" }]} />
      <div className="page single">
        <main>
          <PageTitle title="Members" attached />
          <SectionNav section="community" active="/users" />
          <div className="controls" style={{ borderTop: "none" }}>
            <form action="/users" method="get" style={{ display: "flex", gap: 6 }}>
              <label htmlFor="users-q" className="sr-only">
                Username
              </label>
              <input id="users-q" className="field" type="text" name="q" defaultValue={q} placeholder="Find a member..." />
              <select className="field" name="sort" defaultValue={sort} aria-label="Sort">
                <option value="newest">Newest members</option>
                <option value="posts">Most posts</option>
                <option value="name">Name</option>
              </select>
              <button className="btn primary" type="submit">
                Go
              </button>
            </form>
            <span className="spacer" />
            <span className="hint">{fmtNum(members.length)} members</span>
          </div>
          <Pagination page={page} pages={pages} href={href} />
          <div className="box" style={{ borderTop: "none" }}>
            <table className="yal-table">
              <tbody>
                {shown.map((m) => (
                  <tr key={m.name}>
                    <td style={{ width: 40 }}>
                      <Avatar id={m.avatar} className="avatar xs" />
                    </td>
                    <td>
                      <Link href={`/profile/${encodeURIComponent(m.name)}`} className={m.moderator ? "username mod" : undefined}>
                        {m.name}
                      </Link>
                      <span className="sub">{m.rank}</span>
                    </td>
                    <td className="muted">Joined {m.joinedLabel ?? "?"}</td>
                    <td className="num">{m.postCount !== null ? `${fmtNum(m.postCount)} posts` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shown.length === 0 && <div className="empty">No members matched.</div>}
          </div>
        </main>
      </div>
    </>
  );
}
