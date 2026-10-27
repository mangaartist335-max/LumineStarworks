"use client";

import { useActionState, useRef, useState } from "react";
import { BBCode } from "@/components/BBCode";
import { postReplyAction } from "@/app/actions/forum";
import type { FormState } from "@/app/actions/auth";

const TAGS: { label: string; open: string; close: string; title: string }[] = [
  { label: "B", open: "[b]", close: "[/b]", title: "Bold" },
  { label: "I", open: "[i]", close: "[/i]", title: "Italic" },
  { label: "U", open: "[u]", close: "[/u]", title: "Underline" },
  { label: "Quote", open: "[quote]", close: "[/quote]", title: "Quote" },
  { label: "Spoiler", open: "[spoiler]", close: "[/spoiler]", title: "Spoiler" },
  { label: "List", open: "[list]\n[*]", close: "\n[/list]", title: "Bulleted list" },
  { label: "Link", open: "[url=https://]", close: "[/url]", title: "Link" },
];

export function ReplyBox({ threadId, initial }: { threadId: string; initial: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(postReplyAction, null);
  const [text, setText] = useState(initial);
  const [preview, setPreview] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = (open: string, close: string) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const next = text.slice(0, s) + open + text.slice(s, e) + close + text.slice(e);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + open.length, e + open.length);
    });
  };

  return (
    <div className="reply-box" id="reply">
      <div className="reply-box-head">Post a Reply</div>
      <div className="reply-box-body">
        {state?.error && <div className="notice error" role="alert">{state.error}</div>}
        <form action={action}>
          <input type="hidden" name="threadId" value={threadId} />
          <div style={{ display: "flex", gap: 3, marginBottom: 5, flexWrap: "wrap" }} role="toolbar" aria-label="Formatting">
            {TAGS.map((t) => (
              <button key={t.label} type="button" className="btn" style={{ padding: "1px 7px", fontSize: 11 }} title={t.title} onClick={() => wrap(t.open, t.close)}>
                {t.label}
              </button>
            ))}
          </div>
          <label htmlFor="reply-body" className="sr-only">
            Your reply
          </label>
          <textarea
            id="reply-body"
            ref={ref}
            name="body"
            placeholder="Write your reply..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            required
            maxLength={10000}
          />
          {preview && text.trim() && (
            <div className="quote" style={{ marginTop: 8 }} aria-live="polite">
              <div className="quote-head">Preview</div>
              <div className="post-content" style={{ padding: "8px 10px", fontStyle: "normal" }}>
                <BBCode body={text} />
              </div>
            </div>
          )}
          <div className="reply-box-toolbar">
            <label>
              <input type="checkbox" name="notify" defaultChecked /> Notify me of replies
            </label>
            <span className="spacer" />
            <span className="hint">BBCode enabled · Shift+Enter to post</span>
            <button type="button" className="btn" onClick={() => setPreview((v) => !v)} aria-pressed={preview}>
              {preview ? "Hide Preview" : "Preview"}
            </button>
            <button type="submit" className="btn primary" disabled={pending}>
              {pending ? "Posting..." : "Post Reply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
