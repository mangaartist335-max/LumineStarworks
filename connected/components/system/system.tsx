"use client";

// The running computer: storage, power state, accounts, clock, settings,
// file system, windows, notifications and downloads. Every app reaches the
// rest of the system through useSystem().

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { openIdbStore } from "@/lib/storage/idb";
import type { Store } from "@/lib/storage/types";
import { emptyWm, wmReducer, cascadeRect, type WmAction } from "@/lib/wm";
import { Vfs, type SpecialFolder } from "@/lib/vfs";
import { newId } from "@/lib/ids";
import { iso, simNow } from "@/lib/time";
import { upgradeLegacyEmail, upgradeLegacyUrl } from "@/lib/web/hosts";
import { APPS } from "@/components/apps/catalog";
import { defaultComputer, defaultSettings, sampleFiles } from "./defaults";
import { hashPassword, verifyPassword } from "./password";
import type { ComputerState, DownloadRecord, Phase, System, Toast, UserAccount, UserSettings } from "./types";

const SystemContext = createContext<System | null>(null);

export function useSystem(): System {
  const s = useContext(SystemContext);
  if (!s) throw new Error("useSystem must be used inside SystemProvider");
  return s;
}

export const TASKBAR_HEIGHT = 40;
const BOOT_MS = 2200;
const POWER_MS = 1600;

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [computer, setComputerState] = useState<ComputerState>(defaultComputer);
  const computerRef = useRef(computer);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [settings, setSettingsState] = useState<UserSettings>(defaultSettings);
  const settingsRef = useRef(settings);
  const [vfs, setVfs] = useState<Vfs | null>(null);
  const [folders, setFolders] = useState<Record<SpecialFolder, string> | null>(null);
  const [phase, setPhase] = useState<Phase>("booting");
  const [wm, dispatchWm] = useReducer(wmReducer, emptyWm);
  const wmRef = useRef(wm);
  wmRef.current = wm;
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const controllers = useRef(new Map<string, AbortController>());

  const now = useCallback(() => simNow(computerRef.current.clockOffset), []);

  // Power on: open the drive and read the computer's settings.
  useEffect(() => {
    let cancelled = false;
    openIdbStore()
      .then(async (s) => {
        const saved = (await s.kvGet<ComputerState>("computer")) ?? defaultComputer();
        const c = { ...defaultComputer(), ...saved };
        if (cancelled) return;
        computerRef.current = c;
        setComputerState(c);
        setUsers(await s.list<UserAccount>("users"));
        setStore(s);
      })
      .catch((e) => setFatal(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  const setComputer = useCallback(
    async (patch: Partial<ComputerState>) => {
      const next = { ...computerRef.current, ...patch };
      computerRef.current = next;
      setComputerState(next);
      await store?.kvSet("computer", next);
    },
    [store],
  );

  const notify = useCallback((t: Omit<Toast, "id">) => {
    const id = newId("msg");
    setToasts((list) => [...list.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 6500);
  }, []);

  const dismissToast = useCallback((id: string) => setToasts((list) => list.filter((x) => x.id !== id)), []);

  const loadSession = useCallback(
    async (s: Store, account: UserAccount) => {
      const saved = await s.kvGet<Partial<UserSettings>>(`settings:${account.id}`);
      const merged = { ...defaultSettings(), ...saved, browser: { ...defaultSettings().browser, ...saved?.browser }, messenger: { ...defaultSettings().messenger, ...saved?.messenger } };
      merged.browser.homepage = upgradeLegacyUrl(merged.browser.homepage) ?? merged.browser.homepage;
      const fs = new Vfs(s, account.id, now, account.name);
      const f = await fs.ensureHome(sampleFiles());
      const dls = (await s.list<DownloadRecord>("downloads")).filter((d) => d.owner === account.id);
      // A download cut off by a restart is reported as failed, ready to retry.
      for (const d of dls) if (d.status === "downloading") Object.assign(d, { status: "failed", error: "Interrupted when the computer restarted." });
      settingsRef.current = merged;
      setSettingsState(merged);
      setVfs(fs);
      setFolders(f);
      setDownloads(dls.sort((a, b) => b.startedAt.localeCompare(a.startedAt)));
      setUser(account);
      setPhase("desktop");
    },
    [now],
  );

  // Boot: a moment of the boot screen, then the login screen (or straight
  // to the desktop for a single account without a password, like Windows).
  useEffect(() => {
    if (phase !== "booting" || !store) return;
    const t = setTimeout(async () => {
      await setComputer({ bootCount: computerRef.current.bootCount + 1 });
      const list = await store.list<UserAccount>("users");
      // Accounts made before the sites moved to connectedera.local get their new mail address.
      for (const account of list) {
        const email = upgradeLegacyEmail(account.email);
        if (email === account.email) continue;
        account.email = email;
        await store.put("users", account);
      }
      setUsers(list);
      if (list.length === 1 && !list[0].passwordHash) await loadSession(store, list[0]);
      else setPhase("login");
    }, BOOT_MS);
    return () => clearTimeout(t);
  }, [phase, store, setComputer, loadSession]);

  const createUser = useCallback(
    async (name: string, picture: string, password?: string) => {
      if (!store) throw new Error("not ready");
      const clean = name.trim().slice(0, 32);
      if (!clean) throw new Error("Please type a user name.");
      if (users.some((u) => u.name.toLowerCase() === clean.toLowerCase())) throw new Error("That user name is already taken on this computer.");
      const secret = password ? await hashPassword(password) : null;
      const account: UserAccount = {
        id: newId("usr"),
        name: clean,
        picture,
        email: `${clean.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "user"}@mail.connectedera.local`,
        createdAt: iso(now()),
        origin: "user",
        ...(secret ? { passwordHash: secret.hash, salt: secret.salt } : {}),
      };
      await store.put("users", account);
      setUsers(await store.list<UserAccount>("users"));
      return account;
    },
    [store, users, now],
  );

  const updateUser = useCallback(
    async (id: string, patch: Partial<Pick<UserAccount, "name" | "picture">> & { password?: string | null }) => {
      if (!store) return;
      const current = await store.get<UserAccount>("users", id);
      if (!current) return;
      const { password, ...rest } = patch;
      const next: UserAccount = { ...current, ...rest };
      if (password === null) {
        delete next.passwordHash;
        delete next.salt;
      } else if (password) {
        const secret = await hashPassword(password);
        next.passwordHash = secret.hash;
        next.salt = secret.salt;
      }
      await store.put("users", next);
      setUsers(await store.list<UserAccount>("users"));
      if (user?.id === id) setUser(next);
    },
    [store, user],
  );

  const logIn = useCallback(
    async (id: string, password?: string) => {
      if (!store) return false;
      const account = await store.get<UserAccount>("users", id);
      if (!account) return false;
      if (account.passwordHash && !(await verifyPassword(password ?? "", account.salt!, account.passwordHash))) return false;
      await loadSession(store, account);
      return true;
    },
    [store, loadSession],
  );

  const endSession = useCallback(() => {
    for (const c of controllers.current.values()) c.abort();
    dispatchWm({ type: "closeAll" });
    setToasts([]);
  }, []);

  const logOff = useCallback(() => {
    endSession();
    setUser(null);
    setVfs(null);
    setFolders(null);
    setPhase("login");
  }, [endSession]);

  const shutDown = useCallback(() => {
    endSession();
    setPhase("shutting-down");
    setTimeout(() => {
      setUser(null);
      setVfs(null);
      setPhase("off");
    }, POWER_MS);
  }, [endSession]);

  const restart = useCallback(() => {
    endSession();
    setPhase("restarting");
    setTimeout(() => {
      setUser(null);
      setVfs(null);
      setPhase("booting");
    }, POWER_MS);
  }, [endSession]);

  const powerOn = useCallback(() => setPhase("booting"), []);

  const updateSettings = useCallback(
    async (patch: Partial<UserSettings>) => {
      if (!store || !user) return;
      const next = { ...settingsRef.current, ...patch };
      settingsRef.current = next;
      setSettingsState(next);
      await store.kvSet(`settings:${user.id}`, next);
    },
    [store, user],
  );

  const openApp = useCallback(
    (appId: string, args?: Record<string, unknown>) => {
      const app = APPS[appId];
      if (!app) return null;
      const existing = app.singleInstance ? wmRef.current.windows.find((w) => w.appId === appId) : undefined;
      if (existing) {
        dispatchWm({ type: "focus", id: existing.id });
        if (args) dispatchWm({ type: "setArgs", id: existing.id, args: { ...args, nonce: newId("win") } });
        return existing.id;
      }
      const area = { w: window.innerWidth, h: window.innerHeight - TASKBAR_HEIGHT };
      const id = newId("win");
      dispatchWm({ type: "open", id, appId, title: app.title, rect: cascadeRect(wmRef.current, app.size, area), args, maximized: area.w < 700 });
      return id;
    },
    [],
  );

  // ── Downloads ────────────────────────────────────────────────────────────

  const saveDownload = useCallback(
    async (rec: DownloadRecord) => {
      setDownloads((list) => [rec, ...list.filter((d) => d.id !== rec.id)]);
      if (rec.status !== "downloading") await store?.put("downloads", rec);
    },
    [store],
  );

  const runDownload = useCallback(
    async (start: DownloadRecord, fetchUrl: string): Promise<DownloadRecord> => {
      if (!vfs || !folders) throw new Error("Not logged in");
      const ac = new AbortController();
      controllers.current.set(start.id, ac);
      let rec: DownloadRecord = { ...start, status: "downloading", received: 0, error: undefined };
      await saveDownload(rec);
      try {
        const res = await fetch(fetchUrl, { signal: ac.signal });
        if (!res.ok) throw new Error(`The server responded with an error (${res.status}).`);
        const total = Number(res.headers.get("content-length")) || 0;
        const reader = res.body!.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        let lastUpdate = 0;
        const t0 = performance.now();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          const speed = computerRef.current.connectionSpeed;
          if (speed > 0) {
            const due = (received / speed) * 1000 - (performance.now() - t0);
            if (due > 0) await sleep(due, ac.signal);
          }
          if (performance.now() - lastUpdate > 120) {
            lastUpdate = performance.now();
            rec = { ...rec, received, total };
            setDownloads((list) => list.map((d) => (d.id === rec.id ? rec : d)));
          }
        }
        const blob = new Blob(chunks as BlobPart[], { type: start.mime || res.headers.get("content-type") || "" });
        const file = await vfs.writeFile(folders.downloads, start.filename, blob, { mime: start.mime || undefined, source: start.url });
        rec = { ...rec, received, total: received, status: "complete", fileId: file.id, filename: file.name, finishedAt: iso(now()) };
        await saveDownload(rec);
        notify({ title: "Download complete", body: file.name, icon: "download" });
        return rec;
      } catch (e) {
        const cancelled = ac.signal.aborted;
        rec = { ...rec, status: cancelled ? "cancelled" : "failed", error: cancelled ? undefined : e instanceof Error ? e.message : String(e) };
        await saveDownload(rec);
        if (!cancelled) notify({ title: "Download failed", body: start.filename, icon: "download" });
        return rec;
      } finally {
        controllers.current.delete(start.id);
      }
    },
    [vfs, folders, saveDownload, notify, now],
  );

  // Fetch locations live beside the record so Retry can start over.
  const fetchUrls = useRef(new Map<string, string>());

  const download = useCallback(
    async (url: string, filename: string, opts: { mime?: string; source?: string } = {}) => {
      if (!user) return null;
      const rec: DownloadRecord = {
        id: newId("dl"),
        owner: user.id,
        url: opts.source ?? url,
        filename,
        mime: opts.mime ?? "",
        total: 0,
        received: 0,
        status: "downloading",
        startedAt: iso(now()),
        origin: "user",
      };
      fetchUrls.current.set(rec.id, url);
      await store?.kvSet(`download-src:${rec.id}`, url);
      return runDownload(rec, url);
    },
    [user, now, runDownload, store],
  );

  const cancelDownload = useCallback((id: string) => controllers.current.get(id)?.abort(), []);

  const retryDownload = useCallback(
    async (id: string) => {
      const rec = downloads.find((d) => d.id === id);
      if (!rec || rec.status === "downloading") return;
      const src = fetchUrls.current.get(id) ?? (await store?.kvGet<string>(`download-src:${id}`));
      if (!src) return;
      await runDownload({ ...rec, startedAt: iso(now()) }, src);
    },
    [downloads, runDownload, store, now],
  );

  const value = useMemo<System | null>(
    () =>
      store
        ? {
            store,
            phase,
            computer,
            setComputer,
            now,
            users,
            user,
            settings,
            updateSettings,
            vfs,
            folders,
            wm,
            dispatchWm: dispatchWm as (a: WmAction) => void,
            openApp,
            notify,
            toasts,
            dismissToast,
            createUser,
            updateUser,
            logIn,
            logOff,
            shutDown,
            restart,
            powerOn,
            download,
            cancelDownload,
            retryDownload,
            downloads,
          }
        : null,
    [store, phase, computer, setComputer, now, users, user, settings, updateSettings, vfs, folders, wm, openApp, notify, toasts, dismissToast, createUser, updateUser, logIn, logOff, shutDown, restart, powerOn, download, cancelDownload, retryDownload, downloads],
  );

  if (fatal) return <div className="fatal">The computer couldn&apos;t start: {fatal}</div>;
  if (!value) return <div className="boot-screen" aria-label="Starting" />;
  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

/** The simulated time, refreshed every `interval` ms for clocks and feeds. */
export function useClock(interval = 1000): number {
  const { now } = useSystem();
  const [t, setT] = useState(now);
  useEffect(() => {
    const id = setInterval(() => setT(now()), interval);
    return () => clearInterval(id);
  }, [now, interval]);
  return t;
}
