"use client";

import { useActionState } from "react";
import { createRecommendationAction, createReviewAction } from "@/app/actions/reviews";
import type { FormState } from "@/app/actions/auth";

const CATEGORIES = ["overall", "story", "animation", "sound", "character", "enjoyment"] as const;

export function ReviewForm({ animeId, maxEpisodes }: { animeId: number; maxEpisodes: number | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createReviewAction, null);
  return (
    <form action={action} className="box">
      <div className="box-head">Write a Review</div>
      <div className="box-body">
        {state?.error && <div className="notice error" role="alert">{state.error}</div>}
        <input type="hidden" name="animeId" value={animeId} />
        <table className="form-table">
          <tbody>
            <tr>
              <th>
                <label htmlFor="rv-eps">Episodes seen</label>
              </th>
              <td>
                <input id="rv-eps" className="field short" type="number" name="episodesSeen" min={1} max={maxEpisodes ?? 9999} defaultValue={1} required />
              </td>
            </tr>
            {CATEGORIES.map((c) => (
              <tr key={c}>
                <th>
                  <label htmlFor={`rv-${c}`}>{c[0].toUpperCase() + c.slice(1)}</label>
                </th>
                <td>
                  <select id={`rv-${c}`} className="field" name={c} defaultValue="7">
                    {Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            <tr>
              <th>
                <label htmlFor="rv-body">Review</label>
              </th>
              <td>
                <textarea id="rv-body" name="body" className="field" style={{ minHeight: 180 }} minLength={200} maxLength={10000} required />
                <div className="hint">At least 200 characters. BBCode and [spoiler] tags are supported.</div>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="right">
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function RecommendationForm({ fromId, options }: { fromId: number; options: { id: number; title: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createRecommendationAction, null);
  return (
    <form action={action} className="box">
      <div className="box-head">Make a Recommendation</div>
      <div className="box-body">
        {state?.error && <div className="notice error" role="alert">{state.error}</div>}
        <input type="hidden" name="fromId" value={fromId} />
        <table className="form-table">
          <tbody>
            <tr>
              <th>
                <label htmlFor="rec-to">If you liked this, watch</label>
              </th>
              <td>
                <select id="rec-to" name="toId" className="field wide" required defaultValue="">
                  <option value="" disabled>
                    Choose an anime...
                  </option>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <th>
                <label htmlFor="rec-reason">Why?</label>
              </th>
              <td>
                <textarea id="rec-reason" name="reason" className="field" minLength={40} maxLength={1500} required />
              </td>
            </tr>
          </tbody>
        </table>
        <div className="right">
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? "Submitting..." : "Submit Recommendation"}
          </button>
        </div>
      </div>
    </form>
  );
}
