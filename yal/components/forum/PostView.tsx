import Link from "next/link";
import { BBCode } from "@/components/BBCode";
import { Avatar } from "@/components/ui";
import type { DisplayPost } from "@/lib/archive";
import { formatDateTime } from "@/lib/time";

export function PostView({
  post,
  mine,
  quoteHref,
  reportHref,
  canReply,
}: {
  post: DisplayPost;
  mine: boolean;
  quoteHref: string;
  reportHref: string;
  canReply: boolean;
}) {
  const profile = `/profile/${encodeURIComponent(post.author)}`;
  return (
    <article className={`post${mine ? " user-reply" : ""}`} id={`p${post.number}`} data-origin={post.origin}>
      <div className="post-user">
        <Avatar id={post.avatar} />
        <div>
          <Link href={profile} className={`username${post.moderator ? " mod" : ""}`}>
            {post.author}
          </Link>
          {post.rank && <div className={`rank${post.moderator ? " mod-rank" : ""}`}>{post.rank}</div>}
          <div className="user-meta">
            {post.joinedLabel && (
              <div>
                Joined: <b>{post.joinedLabel}</b>
              </div>
            )}
            {post.postCount !== null && (
              <div>
                Posts: <b>{post.postCount.toLocaleString("en-US")}</b>
              </div>
            )}
            <div className={post.online ? "status-online" : "status-offline"}>{post.online ? "Online" : "Offline"}</div>
          </div>
        </div>
      </div>
      <div className="post-body">
        <div className="post-head">
          <a href={`#p${post.number}`} className="post-num">
            #{post.number}
          </a>
          {mine && (
            <span className="post-yours" style={{ fontSize: 10, fontWeight: "bold" }}>
              [YOUR REPLY]
            </span>
          )}
          <span className="post-time">{formatDateTime(post.displayAt ?? post.at, post.tz)}</span>
        </div>
        <div className={`post-content${post.announcement ? " announcement" : ""}`}>
          <BBCode body={post.body} />
          {post.editedAt && (
            <p className="edited">
              <b>Edited {formatDateTime(post.editedAt, post.editedTz ?? post.tz)}</b>
              {post.editReason && (
                <>
                  <br />
                  Reason: {post.editReason}
                </>
              )}
            </p>
          )}
        </div>
        <div className="post-actions">
          <Link href={quoteHref}>Quote</Link>
          {canReply ? <a href="#reply">Reply</a> : <Link href={quoteHref}>Reply</Link>}
          <Link href={reportHref} className="report">
            Report
          </Link>
        </div>
      </div>
    </article>
  );
}
