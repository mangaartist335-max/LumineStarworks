// AniFanWiki's rules, free of React: page titles, wiki markup, revision
// history and line diffs.
//
// Markup: == Heading ==, === Subheading ===, '''bold''', ''italic'',
// [[Page]], [[Page|label]], [http://address label], * list items, and
// {{spoiler|hidden text}}. A blank line starts a new paragraph. Everything
// else is plain text: nothing typed into the wiki becomes HTML.

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "bold"; children: Inline[] }
  | { kind: "italic"; children: Inline[] }
  | { kind: "link"; target: string; label: string }
  | { kind: "external"; href: string; label: string }
  | { kind: "spoiler"; children: Inline[] };

export type Block =
  | { kind: "heading"; level: 2 | 3; text: string; anchor: string }
  | { kind: "para"; inline: Inline[] }
  | { kind: "list"; items: Inline[][] };

/** Underscores become spaces and only the first letter is raised, like MediaWiki: "sinful_apex" → "Sinful apex". */
export function normalizeTitle(raw: string): string {
  const t = raw.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : "";
}

export const titleToPath = (title: string) => normalizeTitle(title).replace(/ /g, "_");

export const isTalk = (title: string) => /^Talk:/i.test(title);
export const talkOf = (title: string) => `Talk:${normalizeTitle(title)}`;
export const subjectOf = (title: string) => normalizeTitle(title.replace(/^Talk:/i, ""));

const anchorFor = (text: string) => text.replace(/\s+/g, "_").replace(/[^\w-]/g, "");

/** Parses inline markup. Unclosed markers are kept as plain text. */
export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let text = "";
  const flush = () => {
    if (text) out.push({ kind: "text", text });
    text = "";
  };
  let i = 0;
  while (i < src.length) {
    const rest = src.slice(i);
    if (rest.startsWith("{{spoiler|")) {
      const end = findClose(src, i + 10, "{{", "}}");
      if (end >= 0) {
        flush();
        out.push({ kind: "spoiler", children: parseInline(src.slice(i + 10, end)) });
        i = end + 2;
        continue;
      }
    }
    if (rest.startsWith("[[")) {
      const end = src.indexOf("]]", i + 2);
      if (end >= 0) {
        const inner = src.slice(i + 2, end);
        const [target, label] = inner.split("|");
        if (target.trim()) {
          flush();
          out.push({ kind: "link", target: normalizeTitle(target), label: (label ?? target).trim() });
          i = end + 2;
          continue;
        }
      }
    }
    if (rest.startsWith("[http://") || rest.startsWith("[https://")) {
      const end = src.indexOf("]", i + 1);
      if (end >= 0) {
        const inner = src.slice(i + 1, end);
        const space = inner.indexOf(" ");
        const href = space < 0 ? inner : inner.slice(0, space);
        flush();
        out.push({ kind: "external", href, label: space < 0 ? href : inner.slice(space + 1).trim() });
        i = end + 1;
        continue;
      }
    }
    if (rest.startsWith("'''")) {
      const end = src.indexOf("'''", i + 3);
      if (end >= 0) {
        flush();
        out.push({ kind: "bold", children: parseInline(src.slice(i + 3, end)) });
        i = end + 3;
        continue;
      }
    }
    if (rest.startsWith("''")) {
      const end = src.indexOf("''", i + 2);
      if (end >= 0) {
        flush();
        out.push({ kind: "italic", children: parseInline(src.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    text += src[i];
    i++;
  }
  flush();
  return out;
}

/** Index of the closing marker, allowing nested pairs. */
function findClose(src: string, from: number, open: string, close: string): number {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    if (src.startsWith(open, i)) {
      depth++;
      i += open.length - 1;
    } else if (src.startsWith(close, i)) {
      if (depth === 0) return i;
      depth--;
      i += close.length - 1;
    }
  }
  return -1;
}

export function parseWiki(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flushPara = () => {
    if (para.length) blocks.push({ kind: "para", inline: parseInline(para.join(" ")) });
    para = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ kind: "list", items: list.map(parseInline) });
    list = [];
  };
  for (const raw of src.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    const h = /^(={2,3})\s*(.+?)\s*\1$/.exec(line);
    if (h) {
      flushPara();
      flushList();
      blocks.push({ kind: "heading", level: h[1].length as 2 | 3, text: h[2], anchor: anchorFor(h[2]) });
    } else if (line.startsWith("* ")) {
      flushPara();
      list.push(line.slice(2));
    } else if (!line) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

/** Plain text of some markup, for search and summaries. */
export function plainText(src: string): string {
  const walk = (nodes: Inline[]): string =>
    nodes.map((n) => (n.kind === "text" ? n.text : n.kind === "link" || n.kind === "external" ? n.label : walk(n.children))).join("");
  return parseWiki(src)
    .map((b) => (b.kind === "heading" ? b.text : b.kind === "para" ? walk(b.inline) : b.items.map(walk).join(" ")))
    .join("\n");
}

/** Every page a piece of markup links to. */
export function linksIn(src: string): string[] {
  const out = new Set<string>();
  const walk = (nodes: Inline[]) => {
    for (const n of nodes) {
      if (n.kind === "link") out.add(n.target);
      else if (n.kind === "bold" || n.kind === "italic" || n.kind === "spoiler") walk(n.children);
    }
  };
  for (const b of parseWiki(src)) {
    if (b.kind === "para") walk(b.inline);
    else if (b.kind === "list") b.items.forEach(walk);
  }
  return [...out];
}

export interface Revision {
  id: string;
  title: string;
  at: string;
  editor: string;
  summary: string;
  text: string;
  /** Archive revisions came with the wiki; user ones were saved on this computer. */
  user?: boolean;
  owner?: string;
}

/** A page's revisions that exist by `now`, oldest first. */
export function historyOf(title: string, revisions: Revision[], now: number): Revision[] {
  const t = normalizeTitle(title);
  return revisions.filter((r) => normalizeTitle(r.title) === t && Date.parse(r.at) <= now).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}

export type DiffLine = { kind: "same" | "add" | "del"; text: string };

/** Line diff (longest common subsequence), good enough for wiki pages. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");
  const n = a.length;
  const m = b.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ kind: "same", text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) out.push({ kind: "del", text: a[i++] });
    else out.push({ kind: "add", text: b[j++] });
  }
  while (i < n) out.push({ kind: "del", text: a[i++] });
  while (j < m) out.push({ kind: "add", text: b[j++] });
  return out;
}

/** Simple search over titles and text: title matches first. */
export function searchPages(pages: { title: string; text: string }[], query: string): { title: string; snippet: string }[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const scored = pages
    .map((p) => {
      const title = p.title.toLowerCase();
      const body = plainText(p.text);
      const lower = body.toLowerCase();
      if (!words.every((w) => title.includes(w) || lower.includes(w))) return null;
      const score = words.reduce((s, w) => s + (title.includes(w) ? 10 : 0) + (lower.split(w).length - 1), 0);
      const at = Math.max(0, lower.indexOf(words[0]) - 60);
      return { title: p.title, snippet: (at > 0 ? "..." : "") + body.slice(at, at + 180).replace(/\n/g, " ") + "...", score };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  return scored.sort((x, y) => y.score - x.score || x.title.localeCompare(y.title)).map(({ title, snippet }) => ({ title, snippet }));
}
