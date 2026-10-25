"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { APPS, appForFile, iconForFile } from "@/components/apps/catalog";
import type { FileNode } from "@/lib/vfs";
import { ContextMenu, type MenuEntry } from "./ContextMenu";
import { useDialog } from "./Dialogs";
import { Icon, type IconName } from "./Icon";
import { StartMenu } from "./StartMenu";
import { Taskbar } from "./Taskbar";
import { WindowFrame } from "./WindowFrame";
import { useWallpaperUrl } from "./useWallpaper";
import { MessengerService } from "@/components/apps/messenger/service";
import { MailService } from "@/components/apps/mail/service";

interface DesktopItem {
  key: string;
  label: string;
  icon: IconName;
  open: () => void;
  file?: FileNode;
}

export function Desktop() {
  const sys = useSystem();
  const { settings, wm, openApp, folders, vfs, toasts, dismissToast, notify } = sys;
  const dialog = useDialog();
  const wallpaper = useWallpaperUrl(settings.wallpaper);
  const [files] = useCollection<FileNode>("files");
  const [startOpen, setStartOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuEntry[] } | null>(null);

  const desktopFiles = useMemo(() => files.filter((f) => folders && f.parentId === folders.desktop).sort((a, b) => a.name.localeCompare(b.name)), [files, folders]);
  const recycleFull = useMemo(() => files.some((f) => folders && f.parentId === folders.recycle), [files, folders]);

  const openFile = useCallback(
    (f: FileNode) => {
      const target = appForFile(f);
      if (target) openApp(target.appId, target.args);
      else notify({ title: "No program for this file", body: `Connected doesn't know how to open "${f.name}".`, icon: "warning" });
    },
    [openApp, notify],
  );

  const items: DesktopItem[] = [
    { key: "computer", label: "Computer", icon: "computer", open: () => openApp("explorer", { folderId: folders?.home }) },
    { key: "recycle", label: "Recycle Bin", icon: recycleFull ? "recycle-full" : "recycle", open: () => openApp("explorer", { folderId: folders?.recycle }) },
    { key: "browser", label: "Web Browser", icon: "browser", open: () => openApp("browser") },
    { key: "messenger", label: "Messenger", icon: "messenger", open: () => openApp("messenger") },
    { key: "mail", label: "Mail", icon: "mail", open: () => openApp("mail") },
    { key: "games", label: "Games", icon: "games", open: () => openApp("games") },
    { key: "music", label: "Music Player", icon: "music", open: () => openApp("music") },
    ...desktopFiles.map((f) => ({ key: f.id, label: f.name, icon: iconForFile(f), open: () => openFile(f), file: f })),
  ];

  // Ctrl+Esc opens the Start menu, as on Windows.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Escape") {
        e.preventDefault();
        setStartOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const backgroundMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: "New folder",
          onSelect: async () => {
            const name = await dialog.prompt("Name the new folder:", "New folder", { title: "New Folder" });
            if (name && vfs && folders) await vfs.createFolder(folders.desktop, name).catch((err) => dialog.alert(err.message));
          },
        },
        {
          label: "New text document",
          onSelect: async () => {
            const name = await dialog.prompt("Name the new document:", "New Text Document.txt", { title: "New Text Document" });
            if (name && vfs && folders) await vfs.writeFile(folders.desktop, name.endsWith(".txt") ? name : `${name}.txt`, "").catch((err) => dialog.alert(err.message));
          },
        },
        "separator",
        { label: "Personalize", onSelect: () => openApp("settings", { tab: "personalize" }) },
        { label: "Adjust date/time", onSelect: () => openApp("settings", { tab: "datetime" }) },
      ],
    });
  };

  const itemMenu = (e: React.MouseEvent, item: DesktopItem) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(item.key);
    const f = item.file;
    const entries: MenuEntry[] = [{ label: "Open", onSelect: item.open }];
    if (item.key === "recycle") {
      entries.push({
        label: "Empty Recycle Bin",
        disabled: !recycleFull,
        onSelect: async () => {
          if (vfs && (await dialog.confirm("Are you sure you want to permanently delete everything in the Recycle Bin?", { title: "Empty Recycle Bin", okLabel: "Yes" }))) await vfs.emptyRecycleBin();
        },
      });
    }
    if (f && vfs) {
      entries.push(
        "separator",
        {
          label: "Rename",
          onSelect: async () => {
            const name = await dialog.prompt("New name:", f.name, { title: "Rename" });
            if (name && name !== f.name) await vfs.rename(f.id, name).catch((err) => dialog.alert(err.message));
          },
        },
        { label: "Delete", onSelect: () => vfs.trash(f.id).catch((err) => dialog.alert(err.message)) },
      );
      if (f.mime?.startsWith("image/")) entries.splice(1, 0, { label: "Set as desktop background", onSelect: () => sys.updateSettings({ wallpaper: { kind: "file", fileId: f.id } }) });
    }
    setMenu({ x: e.clientX, y: e.clientY, items: entries });
  };

  return (
    <div className="desktop" style={{ ["--accent" as string]: settings.accent }}>
      <div
        className={`wallpaper ${settings.wallpaperFit}`}
        style={wallpaper ? { backgroundImage: `url("${wallpaper}")` } : undefined}
        data-wallpaper={settings.wallpaper.kind === "builtin" ? settings.wallpaper.key : settings.wallpaper.fileId}
        onMouseDown={() => (setSelected(null), setStartOpen(false))}
        onContextMenu={backgroundMenu}
      />
      <div className="desktop-icons" role="list" aria-label="Desktop">
        {items.map((item) => (
          <button
            key={item.key}
            role="listitem"
            className={`desktop-icon${selected === item.key ? " selected" : ""}`}
            onClick={() => setSelected(item.key)}
            onDoubleClick={() => item.open()}
            onKeyDown={(e) => {
              if (e.key === "Enter") item.open();
              if (e.key === "Delete" && item.file && vfs) void vfs.trash(item.file.id);
            }}
            onContextMenu={(e) => itemMenu(e, item)}
            title={item.label}
          >
            <Icon name={item.icon} size={40} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <div className="windows-layer">
        {wm.windows.map((w) => (
          <WindowFrame key={w.id} win={w} focused={wm.focused === w.id} />
        ))}
      </div>
      {toasts.length > 0 && (
        <div className="toasts" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="toast" role="status">
              <Icon name={(t.icon as IconName) ?? "info"} size={24} />
              <div>
                <strong>{t.title}</strong>
                {t.body && <div>{t.body}</div>}
                {t.action && (
                  <button className="flyout-link" style={{ padding: 0 }} onClick={() => (t.action!.run(), dismissToast(t.id))}>
                    {t.action.label}
                  </button>
                )}
              </div>
              <button className="toast-close" aria-label="Dismiss" onClick={() => dismissToast(t.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {startOpen && <StartMenu onClose={() => setStartOpen(false)} />}
      <Taskbar startOpen={startOpen} onToggleStart={() => setStartOpen((v) => !v)} />
      {menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}
      <MessengerService />
      <MailService />
    </div>
  );
}

export const PROGRAM_TITLE = (appId: string) => APPS[appId]?.title ?? appId;
