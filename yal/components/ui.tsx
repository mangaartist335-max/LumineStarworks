import Link from "next/link";
import type { ReactNode } from "react";

/** Avatar from the archived avatar sprite (public/avatars.svg). */
export function Avatar({ id, className = "avatar", label }: { id: string; className?: string; label?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <use href={`/avatars.svg#${id}`} />
    </svg>
  );
}

export function Cover({ src, title, small }: { src?: string; title: string; small?: boolean }) {
  if (src) {
    return (
      <div className="cover contain">
        {/* Archived key visual; plain <img> keeps the 2013 markup simple. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`${title} key visual`} />
      </div>
    );
  }
  return (
    <div className="cover">
      <div className="no-pic" role="img" aria-label={`No picture available for ${title}`}>
        <b>{small ? "No pic" : title}</b>
        {!small && <span>No picture available</span>}
      </div>
    </div>
  );
}

const PORTRAIT_COLORS = ["#2d7c77", "#c0612c", "#7d5c8e", "#a13d49", "#3f6a29", "#195956", "#8f6620", "#5e4a33"];

/** Character/person portrait placeholder: initials on a colour block. */
export function Portrait({ name, id, large }: { name: string; id: number; large?: boolean }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className={`portrait${large ? " large" : ""}`} style={{ background: PORTRAIT_COLORS[id % PORTRAIT_COLORS.length] }} aria-hidden>
      {initials}
    </div>
  );
}

export function NA({ children = "N/A" }: { children?: ReactNode }) {
  return <span className="na">{children}</span>;
}

export function InfoRow({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="row">
      <span className="k">{k}:</span>
      {children}
    </div>
  );
}

/** Forum-style pagination: "Page 1 of 56  « Previous 1 2 3 ... 55 56 Next »". */
export function Pagination({
  page,
  pages,
  href,
  bottom,
}: {
  page: number;
  pages: number;
  href: (p: number) => string;
  bottom?: boolean;
}) {
  const nums = new Set<number>([1, 2, 3, pages - 1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...nums].sort((a, b) => a - b);
  const items: ReactNode[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) items.push(<span key={`gap-${n}`} className="gap">...</span>);
    items.push(
      n === page ? (
        <span key={n} className="current" aria-current="page">
          {n}
        </span>
      ) : (
        <Link key={n} href={href(n)}>
          {n}
        </Link>
      ),
    );
  });
  return (
    <nav className={`pagination${bottom ? " bottom" : ""}`} aria-label={bottom ? "Pages (bottom)" : "Pages"}>
      Page {page} of {pages} &nbsp;{" "}
      {page > 1 ? (
        <Link href={href(page - 1)} className="nav">
          &laquo; Previous
        </Link>
      ) : (
        <span className="nav">&laquo; Previous</span>
      )}{" "}
      {items}{" "}
      {page < pages ? (
        <Link href={href(page + 1)} className="nav">
          Next &raquo;
        </Link>
      ) : (
        <span className="nav">Next &raquo;</span>
      )}
    </nav>
  );
}

export function ArchiveNote({ children }: { children: ReactNode }) {
  return (
    <div className="archive-note">
      <b>Archive note:</b> {children}
    </div>
  );
}

export function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}
