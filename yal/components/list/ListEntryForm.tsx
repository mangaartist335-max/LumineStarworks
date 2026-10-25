"use client";

import { useActionState } from "react";
import { saveListEntryAction } from "@/app/actions/list";
import type { FormState } from "@/app/actions/auth";
import { LIST_STATUSES, type ListEntry } from "@/lib/store/types";

export function ListEntryForm({ animeId, maxEpisodes, entry }: { animeId: number; maxEpisodes: number | null; entry: ListEntry | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveListEntryAction, null);
  return (
    <form action={action}>
      {state?.error && <div className="notice error" role="alert">{state.error}</div>}
      <input type="hidden" name="animeId" value={animeId} />
      <table className="form-table">
        <tbody>
          <tr>
            <th>
              <label htmlFor="le-status">Status</label>
            </th>
            <td>
              <select id="le-status" name="status" className="field" defaultValue={entry?.status ?? "Watching"}>
                {LIST_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="le-eps">Episodes watched</label>
            </th>
            <td>
              <input id="le-eps" name="episodesWatched" className="field short" type="number" min={0} max={maxEpisodes ?? 9999} defaultValue={entry?.episodesWatched ?? 0} /> / {maxEpisodes ?? "?"}
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="le-score">Your score</label>
            </th>
            <td>
              <select id="le-score" name="score" className="field" defaultValue={entry?.score?.toString() ?? ""}>
                <option value="">Select score</option>
                {[
                  [10, "Masterpiece"],
                  [9, "Great"],
                  [8, "Very Good"],
                  [7, "Good"],
                  [6, "Fine"],
                  [5, "Average"],
                  [4, "Bad"],
                  [3, "Very Bad"],
                  [2, "Horrible"],
                  [1, "Appalling"],
                ].map(([n, label]) => (
                  <option key={n} value={n}>
                    ({n}) {label}
                  </option>
                ))}
              </select>
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="le-start">Start date</label>
            </th>
            <td>
              <input id="le-start" name="startDate" className="field" type="date" min="1990-01-01" max="2013-12-31" defaultValue={entry?.startDate ?? ""} />
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="le-finish">Finish date</label>
            </th>
            <td>
              <input id="le-finish" name="finishDate" className="field" type="date" min="1990-01-01" max="2013-12-31" defaultValue={entry?.finishDate ?? ""} />
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="le-notes">Notes</label>
            </th>
            <td>
              <textarea id="le-notes" name="notes" className="field" maxLength={1000} defaultValue={entry?.notes ?? ""} style={{ minHeight: 70 }} />
            </td>
          </tr>
          <tr>
            <th />
            <td>
              <button type="submit" className="btn primary" disabled={pending}>
                {pending ? "Saving..." : entry ? "Update" : "Add to My List"}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </form>
  );
}
