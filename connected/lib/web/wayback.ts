// The Internet Archive's Wayback Machine: a real archive of websites, run by
// the Internet Archive and separate from the Connected Era. The browser links
// to it so a live website can be seen as it was captured back then, in the
// visitor's real browser. A Wayback address takes a UTC timestamp and shows
// the capture closest to it; old captures can be missing pictures, links or
// scripts, and some pages were never captured.

export const WAYBACK_HOST = "web.archive.org";

/** The Wayback Machine's captures start in 1996. */
export const WAYBACK_EARLIEST = "1996-01-01";

/** "20130907200000": a moment as the Wayback Machine's 14-digit UTC timestamp. */
export function waybackTimestamp(t: number): string {
  return new Date(t).toISOString().replace(/\D/g, "").slice(0, 14);
}

/** The Wayback Machine address for `href` as captured closest to `t`. */
export function waybackUrl(href: string, t: number): string {
  return `https://${WAYBACK_HOST}/web/${waybackTimestamp(t)}/${href.replace(/#.*$/, "")}`;
}

/** The Internet Archive's own sites, where a Wayback link would just point back at itself. */
export const isInternetArchiveHost = (host: string) => /(^|\.)archive\.org$/i.test(host);
