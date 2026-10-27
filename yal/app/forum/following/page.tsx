import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle } from "@/components/SectionNav";
import { NA, fmtNum } from "@/components/ui";
import { getThread, summarize } from "@/lib/forum";
import { getStore } from "@/lib/store";
import { getViewer } from "@/lib/viewer";
import { relativeTo } from "@/lib/time";

export const metadata: Metadata = { title: "Followed Topics" };

export default async function FollowingPage() {
  const viewer = await getViewer();
  if (!viewer.account) redirect("/login?next=/forum/following");
  const ids = await getStore().listFollows(viewer.account.id);
  const threads = (await Promise.all(ids.map((id) => getThread(id, viewer.asOf)))).filter((t): t is NonNullable<typeof t> => Boolean(t));
  const rows = await Promise.all(threads.map((t) => summarize(t, viewer.asOf)));

  return (
    <>
      <Breadcrumb items={[{ label: "Forums", href: "/forum" }, { label: "Followed Topics" }]} />
      <div className="page single">
        <main>
          <PageTitle title="Topics You Follow" />
          <div className="box">
            <table className="yal-table forum-table">
              <tbody>
                {rows.map((s) => (
                  <tr key={s.thread.id}>
                    <td className="topic">
                      <Link className="title" href={`/forum/thread/${s.thread.id}`}>
                        {s.thread.title}
                      </Link>
                    </td>
                    <td className="num">{fmtNum(s.snapshot && s.thread.origin === "archive" ? s.snapshot.replies : s.replies)} replies</td>
                    <td className="last">{s.last ? `${relativeTo(s.last.at, viewer.asOf)} by ${s.last.author}` : <NA>-</NA>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="empty">
                You aren&apos;t following any topics that exist at this point in time. Use &quot;Follow Topic&quot; on any thread.
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
