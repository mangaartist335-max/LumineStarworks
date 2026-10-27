"use client";

import { useActionState, useState } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import type { FormState } from "@/app/actions/auth";
import { AvatarPicker } from "./AuthForms";
import type { Account } from "@/lib/store/types";

export function ProfileForm({ account, avatars }: { account: Account; avatars: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, null);
  const [avatar, setAvatar] = useState(account.avatar);
  return (
    <form action={action}>
      {state?.error && <div className="notice error" role="alert">{state.error}</div>}
      {state?.ok && <div className="notice ok" role="status">{state.ok}</div>}
      <input type="hidden" name="avatar" value={avatar} />
      <table className="form-table">
        <tbody>
          <tr>
            <th>Avatar</th>
            <td>
              <AvatarPicker avatars={avatars} value={avatar} onChange={setAvatar} />
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="pf-location">Location</label>
            </th>
            <td>
              <input id="pf-location" name="location" className="field wide" type="text" maxLength={60} defaultValue={account.location} />
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="pf-zone">Time zone</label>
            </th>
            <td>
              <select id="pf-zone" name="timeZone" className="field" defaultValue={account.timeZone}>
                {["JST", "GMT", "CET", "EST", "EDT", "PST", "PDT"].map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
              <div className="hint">Used for the timestamps on your forum posts.</div>
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="pf-about">About me</label>
            </th>
            <td>
              <textarea id="pf-about" name="about" className="field" maxLength={2000} defaultValue={account.about} />
              <div className="hint">BBCode enabled.</div>
            </td>
          </tr>
          <tr>
            <th />
            <td>
              <button type="submit" className="btn primary" disabled={pending}>
                {pending ? "Saving..." : "Save Profile"}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </form>
  );
}
