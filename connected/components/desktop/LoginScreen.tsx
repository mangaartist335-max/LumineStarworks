"use client";

import { useState } from "react";
import { useSystem } from "@/components/system/system";
import { AVATARS, avatarUrl } from "@/components/system/defaults";
import { formatLongDate, formatTime } from "@/lib/time";
import { Icon } from "./Icon";

export function AccountSetup({ onDone, title = "Set up your Connected PC" }: { onDone?: () => void; title?: string }) {
  const { createUser, logIn, users } = useSystem();
  const [name, setName] = useState("");
  const [picture, setPicture] = useState(AVATARS[users.length % AVATARS.length]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="setup"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const account = await createUser(name, picture, password || undefined);
          if (onDone) onDone();
          else await logIn(account.id, password || undefined);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1>{title}</h1>
      <label>
        Type a user name
        <br />
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={32} autoFocus required aria-label="User name" />
      </label>
      <div>
        Choose a picture
        <div className="avatar-grid" role="group" aria-label="Account picture">
          {AVATARS.map((a) => (
            <button type="button" key={a} className="avatar-choice" aria-pressed={picture === a} onClick={() => setPicture(a)} aria-label={a}>
              <img src={avatarUrl(a)} alt="" />
            </button>
          ))}
        </div>
      </div>
      <label>
        Password (optional)
        <br />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" />
      </label>
      {error && <div className="error-text">{error}</div>}
      <div className="dialog-actions" style={{ margin: 0, background: "none", border: 0, padding: 0 }}>
        {onDone && (
          <button type="button" className="btn" onClick={onDone}>
            Cancel
          </button>
        )}
        <button className="btn primary" disabled={busy || !name.trim()}>
          {onDone ? "Create account" : "Start"}
        </button>
      </div>
    </form>
  );
}

export function LoginScreen() {
  const { users, logIn, shutDown, restart, now, computer } = useSystem();
  const [selected, setSelected] = useState<string | null>(users.length === 1 ? users[0].id : null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const account = users.find((u) => u.id === selected);
  const t = now();

  if (users.length === 0 || adding) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <AccountSetup onDone={users.length && adding ? () => setAdding(false) : undefined} title={users.length ? "Add a user" : "Set up your Connected PC"} />
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        {!account ? (
          <>
            <div className="login-users">
              {users.map((u) => (
                <button key={u.id} className="user-tile" onClick={() => (u.passwordHash ? setSelected(u.id) : logIn(u.id))}>
                  <img className="user-picture" src={avatarUrl(u.picture)} alt="" />
                  {u.name}
                </button>
              ))}
            </div>
            <button className="flyout-link" style={{ color: "#fff" }} onClick={() => setAdding(true)}>
              Add a user
            </button>
          </>
        ) : (
          <>
            <img className="user-picture" src={avatarUrl(account.picture)} alt="" />
            <div style={{ fontSize: 22 }}>{account.name}</div>
            {account.passwordHash ? (
              <form
                className="login-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  if (!(await logIn(account.id, password))) setError("The password is incorrect. Try again.");
                }}
              >
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus aria-label="Password" />
                <button className="arrow-button" aria-label="Log on">
                  &rarr;
                </button>
              </form>
            ) : (
              <button className="btn primary" onClick={() => logIn(account.id)} autoFocus>
                Log on
              </button>
            )}
            {error && <div className="login-error">{error}</div>}
            {users.length > 1 && (
              <button className="btn" onClick={() => (setSelected(null), setPassword(""), setError(null))}>
                Switch User
              </button>
            )}
          </>
        )}
      </div>
      <div className="login-footer">
        <span>
          {formatLongDate(t, computer.timeZone)}, {formatTime(t, computer.timeZone)}
        </span>
        <span style={{ display: "flex", gap: 8 }}>
          <button className="login-power" onClick={restart} aria-label="Restart">
            <Icon name="restart" size={14} /> Restart
          </button>
          <button className="login-power" onClick={shutDown} aria-label="Shut down">
            <Icon name="power" size={14} /> Shut down
          </button>
        </span>
      </div>
    </div>
  );
}
