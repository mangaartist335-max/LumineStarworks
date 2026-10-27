// BBCode parser for forum posts, reviews and news.
//
// The parser never produces HTML: it builds a small tree that React renders,
// so user text is always escaped. Unknown tags stay as literal text, stray
// closing tags are ignored, and unclosed tags close at the end of the post.
//
// Supported: [b] [i] [u] [s] [small] [code] [url] [url=...] [quote]
// [quote=Name] [quote=Name;123] [quote="free text"] [spoiler] [spoiler=title]
// [list] [list=1] [*]

export type BBNode =
  | { type: "text"; text: string }
  | { type: "tag"; tag: InlineTag; children: BBNode[] }
  | { type: "url"; href: string | null; children: BBNode[] }
  | { type: "code"; text: string }
  | { type: "quote"; head: QuoteHead; children: BBNode[] }
  | { type: "spoiler"; title: string | null; children: BBNode[] }
  | { type: "list"; ordered: boolean; items: BBNode[][] };

export type InlineTag = "b" | "i" | "u" | "s" | "small";
export type QuoteHead =
  | { kind: "plain" }
  | { kind: "text"; text: string }
  | { kind: "post"; author: string; number: number | null; extra?: string };

const INLINE: InlineTag[] = ["b", "i", "u", "s", "small"];
const KNOWN = new Set<string>([...INLINE, "url", "code", "quote", "spoiler", "list", "*"]);
const TAG_RE = /\[(\/?)([a-z*]+)(?:=((?:"[^"\]]*")|[^\]]*))?\]/gi;

export const MAX_BODY_LENGTH = 10_000;

/** Only http(s) links and site-relative paths survive. */
export function safeHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim().replace(/^"|"$/g, "");
  if (/^\/(?!\/)/.test(v)) return v;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function parseQuoteHead(attr: string | undefined): QuoteHead {
  if (attr === undefined || attr.trim() === "") return { kind: "plain" };
  const v = attr.trim();
  if (v.startsWith('"') && v.endsWith('"') && v.length >= 2) return { kind: "text", text: v.slice(1, -1) };
  const m = /^(.+?);\s*#?(\d+)\s*$/.exec(v);
  if (m) return { kind: "post", author: m[1].trim(), number: Number(m[2]) };
  return { kind: "post", author: v, number: null };
}

type Frame = {
  tag: string;
  attr?: string;
  children: BBNode[];
  // list frames collect items; the current item is `children`
  items?: BBNode[][];
  started?: boolean;
};

export function parseBBCode(input: string): BBNode[] {
  const src = input.length > MAX_BODY_LENGTH * 2 ? input.slice(0, MAX_BODY_LENGTH * 2) : input;
  const root: Frame = { tag: "root", children: [] };
  const stack: Frame[] = [root];
  const top = () => stack[stack.length - 1];
  const pushText = (text: string) => {
    if (!text) return;
    const kids = top().children;
    const last = kids[kids.length - 1];
    if (last && last.type === "text") last.text += text;
    else kids.push({ type: "text", text });
  };

  const close = (frame: Frame): BBNode | null => {
    switch (frame.tag) {
      case "b":
      case "i":
      case "u":
      case "s":
      case "small":
        return { type: "tag", tag: frame.tag, children: frame.children };
      case "url": {
        const href = safeHref(frame.attr ?? textOf(frame.children));
        return { type: "url", href, children: frame.children };
      }
      case "quote":
        return { type: "quote", head: parseQuoteHead(frame.attr), children: frame.children };
      case "spoiler": {
        const t = frame.attr?.trim().replace(/^"|"$/g, "");
        return { type: "spoiler", title: t ? t : null, children: frame.children };
      }
      case "list": {
        const items = [...(frame.items ?? [])];
        if (frame.started || frame.children.some((c) => c.type !== "text" || c.text.trim())) items.push(frame.children);
        return { type: "list", ordered: frame.attr === "1", items: items.map(trimNodes) };
      }
      default:
        return null;
    }
  };

  let last = 0;
  TAG_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TAG_RE.exec(src))) {
    const [raw, slash, nameRaw, attr] = m;
    const name = nameRaw.toLowerCase();
    if (!KNOWN.has(name)) continue;
    pushText(src.slice(last, m.index));
    last = m.index + raw.length;

    if (name === "code" && !slash) {
      // [code] content is literal until the matching [/code].
      const end = src.toLowerCase().indexOf("[/code]", last);
      const text = end === -1 ? src.slice(last) : src.slice(last, end);
      top().children.push({ type: "code", text });
      last = end === -1 ? src.length : end + "[/code]".length;
      TAG_RE.lastIndex = last;
      continue;
    }

    if (name === "*") {
      const listFrame = [...stack].reverse().find((f) => f.tag === "list");
      if (!listFrame || top() !== listFrame) {
        pushText(raw);
        continue;
      }
      // Content before the first [*] (usually just a newline) is dropped.
      listFrame.items = listFrame.items ?? [];
      if (listFrame.started) listFrame.items.push(listFrame.children);
      listFrame.started = true;
      listFrame.children = [];
      continue;
    }

    if (!slash) {
      stack.push({ tag: name, attr: attr ?? undefined, children: [] });
      continue;
    }

    // Closing tag: close up to the matching frame, or ignore if none is open.
    const idx = stack.map((f) => f.tag).lastIndexOf(name);
    if (idx <= 0) continue;
    while (stack.length > idx) {
      const frame = stack.pop()!;
      const node = close(frame);
      if (node) top().children.push(node);
    }
  }
  pushText(src.slice(last));
  while (stack.length > 1) {
    const frame = stack.pop()!;
    const node = close(frame);
    if (node) top().children.push(node);
  }
  return root.children;
}

export function textOf(nodes: BBNode[]): string {
  return nodes
    .map((n) => {
      switch (n.type) {
        case "text":
          return n.text;
        case "code":
          return n.text;
        case "list":
          return n.items.map(textOf).join(" ");
        default:
          return textOf(n.children);
      }
    })
    .join("");
}

function trimNodes(nodes: BBNode[]): BBNode[] {
  const out = [...nodes];
  if (out[0]?.type === "text") out[0] = { type: "text", text: out[0].text.replace(/^\s+/, "") };
  const l = out.length - 1;
  if (out[l]?.type === "text") out[l] = { type: "text", text: (out[l] as { text: string }).text.replace(/\s+$/, "") };
  return out.filter((n) => n.type !== "text" || n.text !== "");
}

export function isBlock(n: BBNode): boolean {
  if (n.type === "quote" || n.type === "spoiler" || n.type === "list") return true;
  if (n.type === "code") return n.text.includes("\n");
  // A formatting tag wrapping a block (e.g. [small][list]...) becomes a block itself.
  if (n.type === "tag") return n.children.some(isBlock);
  return false;
}

/** Plain-text excerpt for previews and search. Spoiler content is masked. */
export function excerpt(body: string, max = 160): string {
  const walk = (nodes: BBNode[]): string =>
    nodes
      .map((n) => {
        if (n.type === "spoiler") return " [spoiler] ";
        if (n.type === "quote") return " ";
        if (n.type === "text" || n.type === "code") return n.text;
        if (n.type === "list") return n.items.map(walk).join(" · ");
        return walk(n.children);
      })
      .join("");
  const text = walk(parseBBCode(body)).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Quote a post for the reply box. Nested quotes are dropped, like 2013 forums did. */
export function quoteFor(author: string, number: number, body: string): string {
  const withoutQuotes = body.replace(/\[quote(?:=[^\]]*)?\][\s\S]*?\[\/quote\]/gi, "").trim();
  return `[quote=${author};${number}]${withoutQuotes}[/quote]\n\n`;
}
