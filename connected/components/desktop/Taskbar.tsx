"use client";

import { useEffect, useRef, useState } from "react";
import { useClock, useSystem } from "@/components/system/system";
import { APPS } from "@/components/apps/catalog";
import { taskbarAction } from "@/lib/wm";
import { formatLongDate, formatShortDate, formatTime, MONTH_NAMES, monthGrid, zonedParts } from "@/lib/time";
import { Icon } from "./Icon";

const PINNED = ["browser", "explorer", "messenger", "mail"];

function useOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const away = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!ref.current?.contains(t) && !t.closest("[data-flyout-toggle]")) onClose();
    };
    window.addEventListener("mousedown", away);
    return () => window.removeEventListener("mousedown", away);
  }, [onClose]);
  return ref;
}

function CalendarFlyout({ onClose }: { onClose: () => void }) {
  const { computer, openApp } = useSystem();
  const now = useClock(1000);
  const today = zonedParts(now, computer.timeZone);
  const [view, setView] = useState({ y: today.y, mo: today.mo });
  const ref = useOutside(onClose);
  const weeks = monthGrid(view.y, view.mo);
  const shift = (d: number) => setView((v) => ({ y: v.y + Math.floor((v.mo + d) / 12), mo: (((v.mo + d) % 12) + 12) % 12 }));
  return (
    <div ref={ref} className="flyout calendar-flyout" role="dialog" aria-label="Calendar">
      <div className="big-time">{formatTime(now, computer.timeZone)}</div>
      <div className="long-date">{formatLongDate(now, computer.timeZone)}</div>
      <div className="calendar-nav">
        <button onClick={() => shift(-1)} aria-label="Previous month">
          ◀
        </button>
        <strong>
          {MONTH_NAMES[view.mo]} {view.y}
        </strong>
        <button onClick={() => shift(1)} aria-label="Next month">
          ▶
        </button>
      </div>
      <table className="calendar-grid">
        <thead>
          <tr>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <th key={d}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((w, i) => (
            <tr key={i}>
              {w.map((d, j) => (
                <td key={j} className={d && view.y === today.y && view.mo === today.mo && d === today.d ? "today" : undefined}>
                  {d ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className="flyout-link"
        onClick={() => {
          onClose();
          openApp("settings", { tab: "datetime" });
        }}
      >
        Change date and time settings...
      </button>
    </div>
  );
}

function VolumeFlyout({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useSystem();
  const ref = useOutside(onClose);
  return (
    <div ref={ref} className="flyout volume-flyout" role="dialog" aria-label="Volume">
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(settings.volume * 100)}
        onChange={(e) => updateSettings({ volume: Number(e.target.value) / 100, muted: false })}
        aria-label="Volume"
      />
      <div>{settings.muted ? "Muted" : `${Math.round(settings.volume * 100)}%`}</div>
      <button className="tool" aria-pressed={settings.muted} onClick={() => updateSettings({ muted: !settings.muted })}>
        <Icon name={settings.muted ? "mute" : "volume"} size={16} /> {settings.muted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
}

function NetworkFlyout({ onClose }: { onClose: () => void }) {
  const ref = useOutside(onClose);
  return (
    <div ref={ref} className="flyout network-flyout" role="dialog" aria-label="Network">
      <strong>Connected to:</strong>
      <p style={{ margin: "6px 0" }}>
        <Icon name="network" size={14} /> Connected Era network (the 2012-2013 web archive)
      </p>
      <p style={{ margin: "6px 0", color: "#5f6b7a" }}>
        Websites from the archive open here as they were at the computer&apos;s current date. Live websites open in your real browser instead, either as they are today or as the Internet Archive&apos;s Wayback Machine saved them back then, so they&apos;re never mistaken for archive pages.
      </p>
    </div>
  );
}

export function Taskbar({ startOpen, onToggleStart }: { startOpen: boolean; onToggleStart: () => void }) {
  const { wm, dispatchWm, openApp, computer, settings, openApp: launch } = useSystem();
  const now = useClock(1000);
  const [flyout, setFlyout] = useState<"calendar" | "volume" | "network" | null>(null);
  const toggle = (f: typeof flyout) => setFlyout((cur) => (cur === f ? null : f));

  const clickPinned = (appId: string) => {
    const open = wm.windows.filter((w) => w.appId === appId).sort((a, b) => b.z - a.z);
    if (open.length) dispatchWm(taskbarAction(wm, open[0].id));
    else openApp(appId);
  };

  return (
    <>
      <div className="taskbar" role="toolbar" aria-label="Taskbar">
        <button className="start-orb" aria-label="Start" aria-expanded={startOpen} onClick={onToggleStart} data-flyout-toggle>
          <span />
        </button>
        <div className="task-buttons">
          {PINNED.map((id) => (
            <button key={id} className="task-button pinned" title={APPS[id].title} aria-label={APPS[id].title} onClick={() => clickPinned(id)}>
              <Icon name={APPS[id].icon} size={24} />
            </button>
          ))}
          {wm.windows.map((w) => (
            <button
              key={w.id}
              className={`task-button open${wm.focused === w.id && !w.minimized ? " active" : ""}`}
              title={w.title}
              onClick={() => dispatchWm(taskbarAction(wm, w.id))}
              data-taskbar-window={w.id}
            >
              <Icon name={APPS[w.appId]?.icon ?? "file"} size={20} />
              <span>{w.title}</span>
            </button>
          ))}
        </div>
        <div className="tray">
          <button className="tray-button" title={`Messenger: ${settings.messenger.status}`} aria-label="Messenger status" onClick={() => launch("messenger")}>
            <span className={`presence-dot presence-${settings.messenger.status}`} />
          </button>
          <button className="tray-button" title="Network" aria-label="Network" onClick={() => toggle("network")} data-flyout-toggle>
            <Icon name="network" size={16} />
          </button>
          <button className="tray-button" title="Volume" aria-label="Volume" onClick={() => toggle("volume")} data-flyout-toggle>
            <Icon name={settings.muted ? "mute" : "volume"} size={16} />
          </button>
          <button className="tray-button clock-button" aria-label="Clock" onClick={() => toggle("calendar")} data-flyout-toggle data-clock={now}>
            <div>{formatTime(now, computer.timeZone)}</div>
            <div>{formatShortDate(now, computer.timeZone)}</div>
          </button>
        </div>
        <button
          className="show-desktop"
          title="Show desktop"
          aria-label="Show desktop"
          onClick={() => {
            for (const w of wm.windows) if (!w.minimized) dispatchWm({ type: "minimize", id: w.id });
          }}
        />
      </div>
      {flyout === "calendar" && <CalendarFlyout onClose={() => setFlyout(null)} />}
      {flyout === "volume" && <VolumeFlyout onClose={() => setFlyout(null)} />}
      {flyout === "network" && <NetworkFlyout onClose={() => setFlyout(null)} />}
    </>
  );
}
