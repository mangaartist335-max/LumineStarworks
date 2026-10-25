"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerAction, signInAction, type FormState } from "@/app/actions/auth";
import { Avatar } from "@/components/ui";

export function LoginForm({ next, mode }: { next: string; mode: "local" | "supabase" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signInAction, null);
  return (
    <form action={action}>
      {state?.error && <div className="notice error" role="alert">{state.error}</div>}
      <input type="hidden" name="next" value={next} />
      <table className="form-table">
        <tbody>
          <tr>
            <th>
              <label htmlFor="login">{mode === "supabase" ? "Email" : "Username or Email"}</label>
            </th>
            <td>
              <input id="login" name="login" className="field wide" type="text" autoComplete="username" required />
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="password">Password</label>
            </th>
            <td>
              <input id="password" name="password" className="field wide" type="password" autoComplete="current-password" required />
            </td>
          </tr>
          <tr>
            <th />
            <td>
              <button className="btn primary" type="submit" disabled={pending}>
                {pending ? "Logging in..." : "Login"}
              </button>{" "}
              <span className="hint">
                No account? <Link href="/register">Sign up</Link>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </form>
  );
}

export function RegisterForm({ avatars }: { avatars: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, null);
  const [avatar, setAvatar] = useState(avatars[1] ?? avatars[0]);
  return (
    <form action={action}>
      {state?.error && <div className="notice error" role="alert">{state.error}</div>}
      <input type="hidden" name="avatar" value={avatar} />
      <table className="form-table">
        <tbody>
          <tr>
            <th>
              <label htmlFor="reg-username">Username</label>
            </th>
            <td>
              <input id="reg-username" name="username" className="field wide" type="text" minLength={3} maxLength={20} pattern="[A-Za-z0-9_\-]+" autoComplete="username" required />
              <div className="hint">3–20 characters: letters, numbers, underscores and dashes.</div>
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="reg-email">Email</label>
            </th>
            <td>
              <input id="reg-email" name="email" className="field wide" type="email" autoComplete="email" required />
              <div className="hint">Never shown on your profile.</div>
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="reg-password">Password</label>
            </th>
            <td>
              <input id="reg-password" name="password" className="field wide" type="password" minLength={8} autoComplete="new-password" required />
            </td>
          </tr>
          <tr>
            <th>
              <label htmlFor="reg-password2">Confirm password</label>
            </th>
            <td>
              <input id="reg-password2" name="password2" className="field wide" type="password" minLength={8} autoComplete="new-password" required />
            </td>
          </tr>
          <tr>
            <th>Avatar</th>
            <td>
              <AvatarPicker avatars={avatars} value={avatar} onChange={setAvatar} />
            </td>
          </tr>
          <tr>
            <th />
            <td>
              <label>
                <input type="checkbox" name="terms" required /> I agree to the <Link href="/terms">Terms of Use</Link>
              </label>
            </td>
          </tr>
          <tr>
            <th />
            <td>
              <button className="btn primary" type="submit" disabled={pending}>
                {pending ? "Creating account..." : "Sign Up"}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </form>
  );
}

export function AvatarPicker({ avatars, value, onChange }: { avatars: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Choose an avatar" style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 520 }}>
      {avatars.map((a) => (
        <button
          key={a}
          type="button"
          role="radio"
          aria-checked={value === a}
          aria-label={a.replace("av-", "")}
          onClick={() => onChange(a)}
          style={{ padding: 2, border: value === a ? "2px solid var(--accent)" : "2px solid transparent", background: "none", cursor: "pointer" }}
        >
          <Avatar id={a} className="avatar xs" />
        </button>
      ))}
    </div>
  );
}
