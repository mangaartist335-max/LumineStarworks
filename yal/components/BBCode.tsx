import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { isBlock, parseBBCode, type BBNode } from "@/lib/bbcode";
import { Spoiler } from "./Spoiler";

/** Render BBCode as React elements. Text is always escaped by React. */
export function BBCode({ body }: { body: string }) {
  return <>{renderBlocks(parseBBCode(body), "r")}</>;
}

function renderInline(text: string, key: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <Fragment key={`${key}-${i}`}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));
}

function renderNode(n: BBNode, key: string): ReactNode {
  switch (n.type) {
    case "text":
      return renderInline(n.text, key);
    case "tag": {
      if (isBlock(n)) {
        const style = { b: { fontWeight: "bold" }, i: { fontStyle: "italic" }, u: { textDecoration: "underline" }, s: { textDecoration: "line-through" }, small: {} }[n.tag];
        return (
          <div key={key} className={n.tag === "small" ? "bb-small" : undefined} style={style}>
            {renderBlocks(n.children, key)}
          </div>
        );
      }
      const kids = n.children.map((c, i) => renderNode(c, `${key}-${i}`));
      if (n.tag === "b") return <b key={key}>{kids}</b>;
      if (n.tag === "i") return <i key={key}>{kids}</i>;
      if (n.tag === "u") return <u key={key}>{kids}</u>;
      if (n.tag === "s") return <s key={key}>{kids}</s>;
      return (
        <span key={key} className="bb-small">
          {kids}
        </span>
      );
    }
    case "url": {
      const kids = n.children.map((c, i) => renderNode(c, `${key}-${i}`));
      if (!n.href) return <Fragment key={key}>{kids}</Fragment>;
      if (n.href.startsWith("/"))
        return (
          <Link key={key} href={n.href}>
            {kids}
          </Link>
        );
      return (
        <a key={key} href={n.href} rel="nofollow ugc noopener noreferrer" target="_blank">
          {kids}
        </a>
      );
    }
    case "code":
      return n.text.includes("\n") ? (
        <pre key={key} className="bb-code">
          {n.text.replace(/^\n|\n$/g, "")}
        </pre>
      ) : (
        <code key={key} className="bb-code-inline">
          {n.text}
        </code>
      );
    case "quote": {
      const h = n.head;
      return (
        <div key={key} className="quote">
          <div className="quote-head">
            {h.kind === "plain" && "Quote"}
            {h.kind === "text" && h.text}
            {h.kind === "post" && (
              <>
                Originally posted by <Link href={`/profile/${encodeURIComponent(h.author)}`}>{h.author}</Link>
                {h.number !== null && (
                  <>
                    {" "}
                    &mdash; <a href={`#p${h.number}`}>#{h.number}</a>
                  </>
                )}
              </>
            )}
          </div>
          <div className="quote-body">{renderBlocks(n.children, key)}</div>
        </div>
      );
    }
    case "spoiler":
      return (
        <Spoiler key={key} title={n.title}>
          {renderBlocks(n.children, key)}
        </Spoiler>
      );
    case "list": {
      const items = n.items.map((item, i) => <li key={`${key}-${i}`}>{item.map((c, j) => renderNode(c, `${key}-${i}-${j}`))}</li>);
      return n.ordered ? (
        <ol key={key} className="bb-list">
          {items}
        </ol>
      ) : (
        <ul key={key} className="bb-list">
          {items}
        </ul>
      );
    }
  }
}

/**
 * Group nodes into paragraphs: blank lines split paragraphs, and block nodes
 * (quotes, spoilers, lists, code blocks) stand on their own.
 */
function renderBlocks(nodes: BBNode[], key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let para: BBNode[] = [];
  const flush = () => {
    // Trim newlines at paragraph edges.
    const trimmed = para
      .map((n, i) => {
        if (n.type !== "text") return n;
        let t = n.text;
        if (i === 0) t = t.replace(/^\n+/, "");
        if (i === para.length - 1) t = t.replace(/\n+$/, "");
        return { ...n, text: t };
      })
      .filter((n) => n.type !== "text" || n.text.trim() !== "" || n.text.includes(" "));
    if (trimmed.some((n) => n.type !== "text" || n.text.trim() !== "")) {
      const k = `${key}-p${out.length}`;
      out.push(<p key={k}>{trimmed.map((n, i) => renderNode(n, `${k}-${i}`))}</p>);
    }
    para = [];
  };
  nodes.forEach((n, i) => {
    if (isBlock(n)) {
      flush();
      out.push(renderNode(n, `${key}-b${i}`));
      return;
    }
    if (n.type === "text" && n.text.includes("\n\n")) {
      const parts = n.text.split(/\n{2,}/);
      parts.forEach((part, j) => {
        if (j > 0) flush();
        if (part) para.push({ type: "text", text: part });
      });
      return;
    }
    para.push(n);
  });
  flush();
  return out;
}
