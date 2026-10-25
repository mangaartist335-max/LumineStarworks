"use client";

import { useEffect, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import { avatarUrl } from "@/components/system/defaults";
import { APPS, appForFile, iconForFile } from "@/components/apps/catalog";
import { interpretInput } from "@/lib/web/url";
import type { FileNode, SpecialFolder } from "@/lib/vfs";
import { Icon } from "./Icon";

export function StartMenu({ onClose }: { onClose: () => void }) {
  const { user, openApp, folders, vfs, shutDown, restart, logOff } = useSystem();
  const [query, setQuery] = useState("");
  const [fileHits, setFileHits] = useState<FileNode[]>([]);
  const [powerMenu, setPowerMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const away = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!ref.current?.contains(t) && !t.closest(".start-orb")) onClose();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("mousedown", away);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("mousedown", away);
      window.removeEventListener("keydown", key);
    };
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    if (!query.trim() || !vfs) {
      setFileHits([]);
      return;
    }
    vfs.search(query).then((hits) => alive && setFileHits(hits.slice(0, 6)));
    return () => {
      alive = false;
    };
  }, [query, vfs]);

  const launch = (appId: string, args?: Record<string, unknown>) => {
    onClose();
    openApp(appId, args);
  };
  const folder = (which: SpecialFolder) => launch("explorer", { folderId: folders?.[which] });

  const programs = Object.entries(APPS).filter(([, a]) => a.start);
  const q = query.trim().toLowerCase();
  const matches = q ? programs.filter(([, a]) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)) : [];
  const web = q ? interpretInput(query) : null;

  return (
    <div ref={ref} className="start-menu" role="dialog" aria-label="Start menu">
      <div className="start-left">
        {!q ? (
          <>
            {programs
              .filter(([, a]) => a.start === "pinned")
              .map(([id, a]) => (
                <button key={id} className="start-item" onClick={() => launch(id)}>
                  <Icon name={a.icon} size={32} />
                  <span>
                    <b>{a.title}</b>
                    <small>{a.description}</small>
                  </span>
                </button>
              ))}
            <div className="start-sep" />
            {programs
              .filter(([, a]) => a.start === "programs")
              .map(([id, a]) => (
                <button key={id} className="start-item" onClick={() => launch(id)}>
                  <Icon name={a.icon} size={24} />
                  {a.title}
                </button>
              ))}
          </>
        ) : (
          <>
            <div className="start-heading">Programs ({matches.length})</div>
            {matches.map(([id, a]) => (
              <button key={id} className="start-item" onClick={() => launch(id)}>
                <Icon name={a.icon} size={24} />
                {a.title}
              </button>
            ))}
            <div className="start-heading">Files ({fileHits.length})</div>
            {fileHits.map((f) => (
              <button
                key={f.id}
                className="start-item"
                onClick={() => {
                  const t = appForFile(f);
                  if (t) launch(t.appId, t.args);
                }}
              >
                <Icon name={iconForFile(f)} size={24} />
                {f.name}
              </button>
            ))}
            {web && (
              <>
                <div className="start-sep" />
                <button className="start-item" onClick={() => launch("browser", { url: web.url })}>
                  <Icon name={web.kind === "address" ? "browser" : "search"} size={24} />
                  {web.kind === "address" ? `Open ${query.trim()}` : `Search the web for "${query.trim()}"`}
                </button>
              </>
            )}
          </>
        )}
      </div>
      <div className="start-right">
        <div className="start-user">{user && <img src={avatarUrl(user.picture)} alt="" />}</div>
        <button className="start-link" onClick={() => folder("home")}>
          {user?.name}
        </button>
        <button className="start-link" onClick={() => folder("documents")}>
          Documents
        </button>
        <button className="start-link" onClick={() => folder("pictures")}>
          Pictures
        </button>
        <button className="start-link" onClick={() => folder("music")}>
          Music
        </button>
        <button className="start-link" onClick={() => folder("videos")}>
          Videos
        </button>
        <button className="start-link" onClick={() => folder("downloads")}>
          Downloads
        </button>
        <div className="start-sep" style={{ borderColor: "rgba(255,255,255,.2)" }} />
        <button className="start-link" onClick={() => launch("explorer", { folderId: folders?.home })}>
          Computer
        </button>
        <button className="start-link" onClick={() => launch("games")}>
          Games
        </button>
        <button className="start-link" onClick={() => launch("settings")}>
          Control Panel
        </button>
      </div>
      <div className="start-bottom">
        <input
          className="start-search"
          placeholder="Search programs and files"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Enter opens the best match, like Windows 7.
            if (e.key !== "Enter" || !q) return;
            const file = fileHits[0] && appForFile(fileHits[0]);
            if (matches[0]) launch(matches[0][0]);
            else if (file) launch(file.appId, file.args);
            else if (web) launch("browser", { url: web.url });
          }}
          autoFocus
          aria-label="Search programs and files"
        />
        <div className="power-split">
          <button onClick={shutDown}>Shut down</button>
          <button aria-label="More power options" aria-expanded={powerMenu} onClick={() => setPowerMenu((v) => !v)}>
            ▸
          </button>
          {powerMenu && (
            <div className="power-menu" role="menu">
              <button className="menu-item" role="menuitem" onClick={logOff}>
                Log off
              </button>
              <button className="menu-item" role="menuitem" onClick={logOff}>
                Switch user
              </button>
              <button className="menu-item" role="menuitem" onClick={restart}>
                Restart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
