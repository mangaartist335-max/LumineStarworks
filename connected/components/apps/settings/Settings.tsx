"use client";

// Control Panel: desktop background and colour, date and time, user
// accounts, the internet connection and information about this computer.

import { useEffect, useState } from "react";
import { useSystem, useClock } from "@/components/system/system";
import { useDialog } from "@/components/desktop/Dialogs";
import { Icon, type IconName } from "@/components/desktop/Icon";
import { AVATARS, avatarUrl, CONNECTION_SPEEDS, defaultComputer } from "@/components/system/defaults";
import { builtinWallpaperUrl, useWallpaperUrl } from "@/components/desktop/useWallpaper";
import { media } from "@/data/media";
import { eraseIdbStore } from "@/lib/storage/idb";
import { ACTIVE_END, ACTIVE_START, DEFAULT_BOOT_TIME, formatDate, formatDateTime, formatLongDate, formatTime, fromInputs, ms, offsetFor, TIME_ZONES, toDateInput, toTimeInput } from "@/lib/time";
import { formatSize } from "@/lib/vfs";
import type { UserSettings } from "@/components/system/types";
import { isImage, useArgs, useFiles } from "../common";
import type { AppProps } from "../registry";

type Tab = "personalize" | "datetime" | "accounts" | "network" | "about";

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "personalize", label: "Personalization", icon: "photos" },
  { id: "datetime", label: "Date and Time", icon: "settings" },
  { id: "accounts", label: "User Accounts", icon: "user" },
  { id: "network", label: "Internet Connection", icon: "network" },
  { id: "about", label: "About this computer", icon: "computer" },
];

/** Backgrounds that come with the computer. More can be downloaded from WallpaperGarden. */
export const BUILTIN_WALLPAPERS = ["connected-blue", "aurora-lake", "harbor-lights", "cherry-hills"];

const ACCENTS = ["#4a8cd6", "#2f9e8f", "#6aa84f", "#e69138", "#cc4125", "#c27ba0", "#8e7cc3", "#5f6b7a"];

export default function Settings({ win }: AppProps) {
  const [tab, setTab] = useState<Tab>("personalize");
  useArgs(win, (args) => {
    if (typeof args.tab === "string" && TABS.some((t) => t.id === args.tab)) setTab(args.tab as Tab);
  });
  return (
    <div className="settings">
      <nav className="st-nav" aria-label="Control Panel">
        <div className="st-nav-head">Control Panel</div>
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)} aria-current={tab === t.id}>
            <Icon name={t.icon} size={20} /> {t.label}
          </button>
        ))}
      </nav>
      <div className="st-page scroll">
        {tab === "personalize" && <Personalize />}
        {tab === "datetime" && <DateTime />}
        {tab === "accounts" && <Accounts />}
        {tab === "network" && <Network />}
        {tab === "about" && <About />}
      </div>
    </div>
  );
}

function Personalize() {
  const { settings, updateSettings } = useSystem();
  const files = useFiles();
  const pictures = files.filter((f) => f.kind === "file" && isImage(f) && !f.trashed);
  const preview = useWallpaperUrl(settings.wallpaper);
  const current = settings.wallpaper;
  return (
    <section>
      <h1>Change the desktop background</h1>
      <div className="st-preview" style={{ backgroundImage: preview ? `url("${preview}")` : undefined, backgroundSize: settings.wallpaperFit === "fill" ? "cover" : settings.wallpaperFit === "fit" ? "contain" : "auto", backgroundRepeat: settings.wallpaperFit === "tile" ? "repeat" : "no-repeat", borderColor: settings.accent }} aria-label="Preview" />
      <h2>Connected backgrounds</h2>
      <div className="st-walls">
        {BUILTIN_WALLPAPERS.map((key) => (
          <button key={key} className={current.kind === "builtin" && current.key === key ? "on" : ""} onClick={() => updateSettings({ wallpaper: { kind: "builtin", key } })} aria-pressed={current.kind === "builtin" && current.key === key} title={media(`wallpaper:${key}`).title}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={media(`wallpaper-thumb:${key}`).url} alt={media(`wallpaper:${key}`).title ?? key} onError={(e) => (e.currentTarget.src = builtinWallpaperUrl(key))} />
          </button>
        ))}
      </div>
      <h2>Your pictures</h2>
      {pictures.length === 0 ? (
        <p className="muted">Pictures you save or download show up here.</p>
      ) : (
        <div className="st-walls">
          {pictures.map((p) => (
            <PictureChoice key={p.id} id={p.id} name={p.name} on={current.kind === "file" && current.fileId === p.id} onPick={() => updateSettings({ wallpaper: { kind: "file", fileId: p.id } })} />
          ))}
        </div>
      )}
      <p className="muted">Find more free backgrounds at wallpapers.connectedera.local.</p>
      <h2>Picture position</h2>
      <div className="st-row">
        {(["fill", "fit", "center", "tile"] as UserSettings["wallpaperFit"][]).map((fit) => (
          <label key={fit}>
            <input type="radio" name="fit" checked={settings.wallpaperFit === fit} onChange={() => updateSettings({ wallpaperFit: fit })} /> {fit[0].toUpperCase() + fit.slice(1)}
          </label>
        ))}
      </div>
      <h2>Window colour</h2>
      <div className="st-row">
        {ACCENTS.map((c) => (
          <button key={c} className={`st-swatch${settings.accent === c ? " on" : ""}`} style={{ background: c }} onClick={() => updateSettings({ accent: c })} aria-label={`Colour ${c}`} aria-pressed={settings.accent === c} />
        ))}
        <label>
          Custom <input type="color" value={settings.accent} onChange={(e) => updateSettings({ accent: e.target.value })} />
        </label>
      </div>
    </section>
  );
}

function PictureChoice({ id, name, on, onPick }: { id: string; name: string; on: boolean; onPick: () => void }) {
  const url = useWallpaperUrl({ kind: "file", fileId: id });
  return (
    <button className={on ? "on" : ""} onClick={onPick} aria-pressed={on} title={name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt={name} />}
      <span>{name}</span>
    </button>
  );
}

function DateTime() {
  const { computer, setComputer } = useSystem();
  const t = useClock();
  const zone = computer.timeZone;
  const [date, setDate] = useState(() => toDateInput(t, zone));
  const [time, setTime] = useState(() => toTimeInput(t, zone));
  const [msg, setMsg] = useState<string | null>(null);
  const min = toDateInput(ms(ACTIVE_START), zone);
  const max = toDateInput(ms(ACTIVE_END), zone);
  return (
    <section>
      <h1>Date and Time</h1>
      <div className="st-clock">
        <div className="st-big">{formatTime(t, zone)}</div>
        <div>{formatLongDate(t, zone)}</div>
      </div>
      <p className="muted">
        This computer lives in the Connected Era. You can set its clock anywhere from {formatDate(ms(ACTIVE_START), zone)} to {formatDate(ms(ACTIVE_END), zone)}. Websites only show what had been published by the date you choose.
      </p>
      <form
        className="st-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const target = fromInputs(date, time, zone);
          if (target === null) return setMsg("Please enter a full date and time.");
          if (target < ms(ACTIVE_START) || target > ms(ACTIVE_END)) return setMsg(`Pick a date between ${formatDate(ms(ACTIVE_START), zone)} and ${formatDate(ms(ACTIVE_END), zone)}.`);
          await setComputer({ clockOffset: offsetFor(target) });
          setMsg(`The clock now reads ${formatDateTime(target, zone)}.`);
        }}
      >
        <label>
          Date <input className="field" type="date" value={date} min={min} max={max} onChange={(e) => setDate(e.target.value)} aria-label="Date" required />
        </label>
        <label>
          Time <input className="field" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time" required />
        </label>
        <div className="st-row">
          <button className="btn primary">Change date and time</button>
          <button
            type="button"
            className="btn"
            onClick={async () => {
              await setComputer({ clockOffset: offsetFor(ms(DEFAULT_BOOT_TIME)) });
              setDate(toDateInput(ms(DEFAULT_BOOT_TIME), zone));
              setTime(toTimeInput(ms(DEFAULT_BOOT_TIME), zone));
              setMsg(`The clock now reads ${formatDateTime(ms(DEFAULT_BOOT_TIME), zone)}.`);
            }}
          >
            Reset to the default date
          </button>
        </div>
        {msg && <div role="status">{msg}</div>}
      </form>
      <h2>Time zone</h2>
      <select
        className="field"
        value={zone}
        onChange={async (e) => {
          await setComputer({ timeZone: e.target.value });
          setDate(toDateInput(t, e.target.value));
          setTime(toTimeInput(t, e.target.value));
        }}
        aria-label="Time zone"
      >
        {TIME_ZONES.map((z) => (
          <option key={z.id} value={z.id}>
            {z.label}
          </option>
        ))}
      </select>
      <h2>Region</h2>
      <select className="field" value={computer.region} onChange={(e) => setComputer({ region: e.target.value })} aria-label="Region">
        <option value="US">United States</option>
        <option value="CA">Canada</option>
        <option value="GB">United Kingdom</option>
        <option value="AU">Australia</option>
        <option value="JP">Japan</option>
        <option value="DE">Germany</option>
        <option value="BR">Brazil</option>
      </select>
      <p className="muted">Some videos and pages are only offered in certain regions.</p>
    </section>
  );
}

function Accounts() {
  const { user, users, updateUser, createUser, logOff } = useSystem();
  const dialog = useDialog();
  const [name, setName] = useState(user?.name ?? "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  if (!user) return null;
  return (
    <section>
      <h1>User Accounts</h1>
      <div className="st-user">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl(user.picture)} alt="" />
        <div>
          <strong>{user.name}</strong>
          <div className="muted">{user.email}</div>
          <div className="muted">{user.passwordHash ? "Password protected" : "No password"}</div>
        </div>
      </div>
      <h2>Change your picture</h2>
      <div className="avatar-grid">
        {AVATARS.map((a) => (
          <button key={a} className="avatar-choice" aria-pressed={user.picture === a} onClick={() => updateUser(user.id, { picture: a })} aria-label={a}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl(a)} alt="" />
          </button>
        ))}
      </div>
      <h2>Change your name</h2>
      <form
        className="st-row"
        onSubmit={async (e) => {
          e.preventDefault();
          const clean = name.trim();
          if (!clean) return;
          if (users.some((u) => u.id !== user.id && u.name.toLowerCase() === clean.toLowerCase())) return setMsg("That name is already used on this computer.");
          await updateUser(user.id, { name: clean.slice(0, 32) });
          setMsg("Your name was changed.");
        }}
      >
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} aria-label="Account name" maxLength={32} />
        <button className="btn">Change name</button>
      </form>
      <h2>{user.passwordHash ? "Change your password" : "Create a password"}</h2>
      <form
        className="st-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pw.length < 4) return setMsg("Use at least 4 characters.");
          if (pw !== pw2) return setMsg("The passwords don't match.");
          await updateUser(user.id, { password: pw });
          setPw("");
          setPw2("");
          setMsg("Your password was saved. You'll need it next time you log on.");
        }}
      >
        <input className="field" type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="New password" autoComplete="new-password" />
        <input className="field" type="password" placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} aria-label="Confirm new password" autoComplete="new-password" />
        <div className="st-row">
          <button className="btn">Save password</button>
          {user.passwordHash && (
            <button
              type="button"
              className="btn"
              onClick={async () => {
                if (await dialog.confirm("Remove your password? Anyone using this computer will be able to open your account.", { title: "Remove password", okLabel: "Remove" })) {
                  await updateUser(user.id, { password: null });
                  setMsg("Your password was removed.");
                }
              }}
            >
              Remove password
            </button>
          )}
        </div>
      </form>
      <p className="muted">Passwords are stored on this computer only, as a salted hash.</p>
      {msg && <div role="status">{msg}</div>}
      <h2>Other accounts on this computer</h2>
      <ul className="plain-list">
        {users
          .filter((u) => u.id !== user.id)
          .map((u) => (
            <li key={u.id} className="st-user small">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl(u.picture)} alt="" /> {u.name} <span className="muted">{u.email}</span>
            </li>
          ))}
        {users.length === 1 && <li className="muted">Only you so far. Add an account for family or friends, and you can message and email each other.</li>}
      </ul>
      <form
        className="st-row"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const created = await createUser(newName, AVATARS[(users.length * 5) % AVATARS.length]);
            setNewName("");
            setMsg(`${created.name}'s account was created. They can log on from the Welcome screen (Start > Log off).`);
          } catch (err) {
            setMsg(err instanceof Error ? err.message : String(err));
          }
        }}
      >
        <input className="field" placeholder="New account name" value={newName} onChange={(e) => setNewName(e.target.value)} aria-label="New account name" maxLength={32} />
        <button className="btn" disabled={!newName.trim()}>
          Create account
        </button>
        <button type="button" className="btn" onClick={logOff}>
          Log off
        </button>
      </form>
    </section>
  );
}

function Network() {
  const { computer, setComputer } = useSystem();
  return (
    <section>
      <h1>Internet Connection</h1>
      <p>Choose how fast this computer&apos;s connection is. Downloads take as long as they would have on that connection.</p>
      <div className="st-form">
        {CONNECTION_SPEEDS.map((s) => (
          <label key={s.label}>
            <input type="radio" name="speed" checked={computer.connectionSpeed === s.bytesPerSecond} onChange={() => setComputer({ connectionSpeed: s.bytesPerSecond })} /> {s.label}
          </label>
        ))}
      </div>
      <h2>About the web on this computer</h2>
      <p className="muted">
        Sites like MeTube, MangaShelf, Birdie and YourAnimeList are part of the Connected Era archive and work offline. Any other address is a live website. The browser labels it clearly and offers to open it in your real browser, either today&apos;s version or the Wayback Machine&apos;s copy from back then, instead of showing it as a 2012-2013 page.
      </p>
    </section>
  );
}

function About() {
  const { computer, users, setComputer } = useSystem();
  const dialog = useDialog();
  const files = useFiles();
  const [usage, setUsage] = useState<string | null>(null);
  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setUsage(e.usage !== undefined ? formatSize(e.usage) : null));
  }, []);
  return (
    <section>
      <h1>About this computer</h1>
      <div className="st-about">
        <Icon name="computer" size={64} />
        <dl>
          <dt>Computer</dt>
          <dd>Connected PC</dd>
          <dt>Set up</dt>
          <dd>{formatDate(ms(computer.installedAt), computer.timeZone)}</dd>
          <dt>Times started</dt>
          <dd>{computer.bootCount}</dd>
          <dt>Accounts</dt>
          <dd>{users.length}</dd>
          <dt>Your files</dt>
          <dd>
            {files.filter((f) => f.kind === "file").length} files, {formatSize(files.reduce((s, f) => s + (f.kind === "file" ? f.size : 0), 0))}
          </dd>
          {usage && (
            <>
              <dt>Storage used</dt>
              <dd>{usage} in this web browser</dd>
            </>
          )}
        </dl>
      </div>
      <p className="muted">Everything on this computer (accounts, files, messages and settings) is saved in your web browser&apos;s storage on this device. Nothing is uploaded anywhere.</p>
      <h2>Start over</h2>
      <div className="st-row">
        <button
          className="btn"
          onClick={async () => {
            if (await dialog.confirm("Put the clock, time zone and connection speed back to how they were when the computer was new? Your files and accounts stay.", { title: "Restore defaults", okLabel: "Restore" })) {
              const d = defaultComputer();
              await setComputer({ clockOffset: d.clockOffset, timeZone: d.timeZone, connectionSpeed: d.connectionSpeed, region: d.region });
            }
          }}
        >
          Restore default settings
        </button>
        <button
          className="btn"
          onClick={async () => {
            if (!(await dialog.confirm("Reset this computer? Every account, file, message, bookmark and setting on it will be erased, and it will start fresh like a new PC.", { title: "Reset this computer", okLabel: "Erase everything" }))) return;
            await eraseIdbStore();
            window.location.reload();
          }}
        >
          Reset this computer...
        </button>
      </div>
    </section>
  );
}
