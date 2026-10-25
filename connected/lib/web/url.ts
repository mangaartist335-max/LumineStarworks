// Addresses inside the Connected Era browser.
//
// Original Connected Era sites live at fictional addresses
// (http://www.metube.com/watch?v=...). The browser parses whatever is typed
// into the address bar, decides whether it is an address or a search, and
// routes archive hosts to the site that serves them. Anything else is a live
// website outside the archive and is never presented as a 2012-2013 page.

export interface WebUrl {
  href: string;
  protocol: "http:" | "https:" | "about:";
  /** Host without "www.". */
  host: string;
  path: string;
  params: URLSearchParams;
  hash: string;
}

export const SEARCH_HOST = "goggle.com";
export const HOME_URL = "http://www.goggle.com/";
export const NEW_TAB_URL = "about:newtab";

export function searchUrl(query: string, extra: Record<string, string> = {}): string {
  const p = new URLSearchParams({ q: query, ...extra });
  return `http://www.${SEARCH_HOST}/search?${p.toString()}`;
}

export function canonicalHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

export function parseUrl(href: string): WebUrl | null {
  const v = href.trim();
  if (/^about:/i.test(v)) {
    const rest = v.slice(6);
    const [pathAndQuery, hash = ""] = rest.split("#");
    const [path, query = ""] = pathAndQuery.split("?");
    return { href: v, protocol: "about:", host: "", path: path.toLowerCase(), params: new URLSearchParams(query), hash: hash ? `#${hash}` : "" };
  }
  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return {
      href: u.toString(),
      protocol: u.protocol,
      host: canonicalHost(u.hostname),
      path: u.pathname || "/",
      params: u.searchParams,
      hash: u.hash,
    };
  } catch {
    return null;
  }
}

const LOOKS_LIKE_HOST = /^(localhost|[a-z0-9-]+(\.[a-z0-9-]+)+)(:\d+)?([/?#].*)?$/i;

/**
 * What the address bar should do with typed text: open an address, or
 * search for it. Returns null for empty input.
 */
export function interpretInput(input: string): { kind: "address" | "search"; url: string } | null {
  const v = input.trim();
  if (!v) return null;
  if (/^about:/i.test(v)) return { kind: "address", url: v.toLowerCase() };
  if (/^https?:\/\//i.test(v)) {
    const u = parseUrl(v);
    return u ? { kind: "address", url: u.href } : { kind: "search", url: searchUrl(v) };
  }
  if (!/\s/.test(v) && LOOKS_LIKE_HOST.test(v)) {
    const u = parseUrl(`http://${v}`);
    if (u) return { kind: "address", url: u.href };
  }
  return { kind: "search", url: searchUrl(v) };
}

/** Builds an archive address: `site("metube.com", "/watch", { v: id })`. */
export function siteUrl(host: string, path = "/", params?: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, val] of Object.entries(params ?? {})) if (val !== undefined && val !== "") p.set(k, String(val));
  const q = p.toString();
  return `http://www.${host}${path}${q ? `?${q}` : ""}`;
}

/** Same page, ignoring the fragment. */
export function samePage(a: string, b: string): boolean {
  return a.split("#")[0] === b.split("#")[0];
}
