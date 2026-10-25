"use client";

import { useActionState } from "react";
import { createThreadAction } from "@/app/actions/forum";
import type { FormState } from "@/app/actions/auth";

export function NewTopicForm({
  boards,
  board,
  anime,
  animeId,
}: {
  boards: { slug: string; name: string }[];
  board: string;
  anime: { id: number; title: string }[];
  animeId: number | null;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(createThreadAction, null);
  return (
    <form action={action} className="box">
      <div className="box-head">New Topic</div>
      <div className="box-body">
        {state?.error && <div className="notice error" role="alert">{state.error}</div>}
        <table className="form-table">
          <tbody>
            <tr>
              <th>
                <label htmlFor="nt-board">Board</label>
              </th>
              <td>
                <select id="nt-board" name="board" className="field wide" defaultValue={board} required>
                  {boards.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <th>
                <label htmlFor="nt-anime">Related anime</label>
              </th>
              <td>
                <select id="nt-anime" name="animeId" className="field wide" defaultValue={animeId ?? ""}>
                  <option value="">None</option>
                  {anime.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <th>
                <label htmlFor="nt-title">Title</label>
              </th>
              <td>
                <input id="nt-title" name="title" className="field wide" type="text" minLength={4} maxLength={120} required />
              </td>
            </tr>
            <tr>
              <th>
                <label htmlFor="nt-body">Message</label>
              </th>
              <td>
                <textarea id="nt-body" name="body" className="field" style={{ minHeight: 180 }} maxLength={10000} required />
                <div className="hint">BBCode enabled: [b], [i], [u], [quote], [spoiler], [list], [url].</div>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="right">
          <button type="submit" className="btn primary" disabled={pending}>
            {pending ? "Posting..." : "Post Topic"}
          </button>
        </div>
      </div>
    </form>
  );
}
