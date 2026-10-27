import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BBCode } from "@/components/BBCode";
import { ReportForm } from "@/components/forum/ReportForm";
import { getThread, threadPosts } from "@/lib/forum";
import { getViewer } from "@/lib/viewer";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Report Post" };

export default async function ReportPage(props: PageProps<"/forum/report">) {
  const sp = await props.searchParams;
  const threadId = String(Array.isArray(sp.thread) ? sp.thread[0] : sp.thread ?? "");
  const postKey = String(Array.isArray(sp.post) ? sp.post[0] : sp.post ?? "");
  const viewer = await getViewer();
  if (!viewer.account) redirect(`/login?next=${encodeURIComponent(`/forum/report?thread=${threadId}&post=${postKey}`)}`);
  const thread = await getThread(threadId, viewer.asOf);
  if (!thread) notFound();
  const posts = await threadPosts(thread.id, viewer.asOf);
  const index = posts.findIndex((p) => p.key === postKey);
  if (index < 0) notFound();
  const post = posts[index];
  const back = `/forum/thread/${thread.id}?page=${Math.floor(index / 20) + 1}#p${post.number}`;

  return (
    <>
      <Breadcrumb items={[{ label: "Forums", href: "/forum" }, { label: thread.title, href: `/forum/thread/${thread.id}` }, { label: "Report Post" }]} />
      <div className="page single">
        <main>
          <div className="box">
            <div className="box-head">Report post #{post.number} by {post.author}</div>
            <div className="box-body">
              <div className="quote">
                <div className="quote-head">
                  {post.author} &mdash; {formatDateTime(post.displayAt ?? post.at, post.tz)}
                </div>
                <div className="quote-body" style={{ fontStyle: "normal", maxHeight: 240, overflow: "auto" }}>
                  <BBCode body={post.body} />
                </div>
              </div>
              <ReportForm threadId={thread.id} postKey={post.key} back={back} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
