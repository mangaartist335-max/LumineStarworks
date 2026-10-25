"use client";

import Link from "next/link";
import { useActionState } from "react";
import { reportPostAction } from "@/app/actions/forum";
import type { FormState } from "@/app/actions/auth";

export function ReportForm({ threadId, postKey, back }: { threadId: string; postKey: string; back: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(reportPostAction, null);
  if (state?.ok) {
    return (
      <div className="notice ok" role="status">
        {state.ok} <Link href={back}>Back to the topic</Link>
      </div>
    );
  }
  return (
    <form action={action}>
      {state?.error && <div className="notice error" role="alert">{state.error}</div>}
      <input type="hidden" name="threadId" value={threadId} />
      <input type="hidden" name="postKey" value={postKey} />
      <label htmlFor="report-reason">
        <b>Why are you reporting this post?</b>
      </label>
      <textarea id="report-reason" name="reason" className="field" required minLength={5} maxLength={1000} placeholder="Spoilers without tags, harassment, spam..." />
      <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
        <button className="btn primary" type="submit" disabled={pending}>
          {pending ? "Sending..." : "Send Report"}
        </button>
        <Link href={back} className="btn">
          Cancel
        </Link>
      </div>
    </form>
  );
}
