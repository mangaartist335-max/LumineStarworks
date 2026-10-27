import Link from "next/link";
import { Fragment } from "react";

export type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "YourAnimeList", href: "/" }, ...items];
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {all.map((c, i) => (
        <Fragment key={`${c.label}-${i}`}>
          {i > 0 && <span className="sep">&raquo;</span>}
          {c.href && i < all.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span aria-current={i === all.length - 1 ? "page" : undefined}>{c.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}
