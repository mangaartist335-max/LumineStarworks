"use client";

// Games: your installed games with their saves, high scores, achievements
// and launch history. New games install from Freeware Corner.

import { useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { useDialog } from "@/components/desktop/Dialogs";
import { Icon, type IconName } from "@/components/desktop/Icon";
import { gameById, type GameInfo } from "@/data/games";
import { formatDate, formatDateTime, iso } from "@/lib/time";
import { useArgs } from "../common";
import type { AppProps } from "../registry";
import { COL, recordLaunch, useGameSettings, useLibrary, type GameSave, type Installed, type Launch, type Score, type Unlock } from "./data";

const ICONS: Record<string, IconName> = { game_star_courier: "rocket", game_field_sweeper: "sweeper" };

export default function Games({ win }: AppProps) {
  const { store, user, now, computer, openApp, notify } = useSystem();
  const dialog = useDialog();
  const { games, released, isInstalled } = useLibrary();
  const [launches] = useCollection<Launch>(COL.launches);
  const [unlocks] = useCollection<Unlock>(COL.unlocks);
  const [saves] = useCollection<GameSave>(COL.saves);
  const [scores] = useCollection<Score>(COL.scores);
  const [settings, setSettings] = useGameSettings();
  const [selected, setSelected] = useState<string>(games[0].id);
  const [message, setMessage] = useState<string | null>(null);

  const install = async (g: GameInfo) => {
    if (!user) return;
    if (!released(g)) {
      setMessage(`${g.title} isn't out yet. It comes out on ${formatDate(Date.parse(g.availability.publishedAt), computer.timeZone)}.`);
      return;
    }
    if (g.builtIn) {
      setMessage(`${g.title} comes with your computer, so it's already installed.`);
      return;
    }
    await store.put<Installed>(COL.installed, { id: `${user.id}:${g.id}`, owner: user.id, gameId: g.id, installedAt: iso(now()) });
    notify({ title: `${g.title} is installed`, body: "Find it in Games.", icon: "games" });
    setMessage(`${g.title} was installed. Have fun!`);
  };

  useArgs(win, (args) => {
    const g = typeof args.install === "string" ? gameById(args.install) : undefined;
    if (g) {
      setSelected(g.id);
      void install(g);
    }
  });

  const play = async (g: GameInfo, saveId?: string) => {
    if (!user) return;
    await recordLaunch(store, user.id, g.id, now());
    openApp(g.appId, saveId ? { saveId, fromLauncher: true } : { fromLauncher: true });
  };

  const g = gameById(selected)!;
  const myUnlocks = unlocks.filter((u) => u.gameId === g.id);
  const mySaves = saves.filter((s) => s.gameId === g.id).sort((a, b) => b.at.localeCompare(a.at));
  const best = scores.filter((s) => s.gameId === g.id).sort((a, b) => (g.id === "game_field_sweeper" ? a.score - b.score : b.score - a.score));
  const lastPlayed = launches.filter((l) => l.gameId === g.id).sort((a, b) => b.at.localeCompare(a.at));
  const installed = isInstalled(g);

  return (
    <div className="games">
      <div className="gm-library">
        <div className="gm-head">Games</div>
        {games.map((x) => (
          <button key={x.id} className={`gm-tile${selected === x.id ? " on" : ""}${isInstalled(x) ? "" : " not-installed"}`} onClick={() => (setSelected(x.id), setMessage(null))} data-game={x.title}>
            <Icon name={ICONS[x.id] ?? "games"} size={40} />
            <span>{x.title}</span>
            <small>{isInstalled(x) ? "Installed" : released(x) ? "Not installed" : "Coming soon"}</small>
          </button>
        ))}
        <div className="gm-more">
          <a
            href="http://freewarecorner.connectedera.local/games"
            onClick={(e) => {
              e.preventDefault();
              openApp("browser", { url: "http://freewarecorner.connectedera.local/games" });
            }}
          >
            Get more games at Freeware Corner
          </a>
        </div>
        <label className="gm-setting">
          <input type="checkbox" checked={settings.sound} onChange={(e) => setSettings({ ...settings, sound: e.target.checked })} /> Sound effects
        </label>
      </div>
      <div className="gm-detail scroll">
        <div className="gm-hero">
          <Icon name={ICONS[g.id] ?? "games"} size={64} />
          <div>
            <h1>{g.title}</h1>
            <div className="muted">
              {g.developer} · {g.genre} · released {formatDate(Date.parse(g.availability.publishedAt), computer.timeZone)}
            </div>
            <p>{g.description}</p>
            <div className="st-row">
              {installed ? (
                <>
                  <button className="btn primary" onClick={() => play(g)}>
                    Play
                  </button>
                  {!g.builtIn && (
                    <button
                      className="btn"
                      onClick={async () => {
                        if (!user || !(await dialog.confirm(`Uninstall ${g.title}? Your saves, scores and achievements stay, so they'll be here if you install it again.`, { title: "Uninstall", okLabel: "Uninstall" }))) return;
                        await store.delete(COL.installed, `${user.id}:${g.id}`);
                        setMessage(`${g.title} was uninstalled.`);
                      }}
                    >
                      Uninstall
                    </button>
                  )}
                </>
              ) : released(g) ? (
                <button className="btn primary" onClick={() => install(g)}>
                  Install
                </button>
              ) : (
                <span className="muted">Comes out on {formatDate(Date.parse(g.availability.publishedAt), computer.timeZone)}.</span>
              )}
              {lastPlayed[0] && <span className="muted">Last played {formatDateTime(Date.parse(lastPlayed[0].at), computer.timeZone)} · played {lastPlayed.length} time{lastPlayed.length === 1 ? "" : "s"}</span>}
            </div>
            {message && (
              <div className="gm-message" role="status">
                {message}
              </div>
            )}
          </div>
        </div>

        <h2>
          Achievements ({myUnlocks.length} of {g.achievements.length})
        </h2>
        <ul className="gm-achievements">
          {g.achievements.map((a) => {
            const u = myUnlocks.find((x) => x.achievementId === a.id);
            return (
              <li key={a.id} className={u ? "unlocked" : ""}>
                <span className="gm-badge">{u ? "🏆" : "🔒"}</span>
                <div>
                  <strong>{a.title}</strong>
                  <div className="muted">{a.description}</div>
                </div>
                {u && <small className="muted">{formatDate(Date.parse(u.at), computer.timeZone)}</small>}
              </li>
            );
          })}
        </ul>

        {g.id === "game_star_courier" && (
          <>
            <h2>Saved games</h2>
            {mySaves.length === 0 ? (
              <p className="muted">Star Courier saves automatically at the start of each level. Press P during a game to save in a slot.</p>
            ) : (
              <ul className="gm-saves">
                {mySaves.map((s) => (
                  <li key={s.id}>
                    <strong>{s.slot === "auto" ? "Autosave" : `Slot ${s.slot}`}</strong> <span>{s.label}</span> <span className="muted">{formatDateTime(Date.parse(s.at), computer.timeZone)}</span>
                    <button className="link-btn" disabled={!installed} onClick={() => play(g, s.id)}>
                      Load
                    </button>
                    <button className="link-btn" onClick={async () => (await dialog.confirm("Delete this saved game?", { title: "Delete save", okLabel: "Delete" })) && store.delete(COL.saves, s.id)}>
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <h2>{g.id === "game_field_sweeper" ? "Best times" : "High scores"}</h2>
        {best.length === 0 ? (
          <p className="muted">No {g.id === "game_field_sweeper" ? "wins" : "scores"} yet.</p>
        ) : (
          <ol className="gm-scores">
            {best.slice(0, 8).map((s) => (
              <li key={s.id}>
                <strong>{g.id === "game_field_sweeper" ? `${s.score} seconds` : s.score.toLocaleString("en-US")}</strong> <span>{s.detail}</span> <span className="muted">{formatDate(Date.parse(s.at), computer.timeZone)}</span>
              </li>
            ))}
          </ol>
        )}

        <h2>Recently played</h2>
        {launches.length === 0 ? (
          <p className="muted">Nothing yet.</p>
        ) : (
          <ul className="plain-list">
            {[...launches]
              .sort((a, b) => b.at.localeCompare(a.at))
              .slice(0, 8)
              .map((l) => (
                <li key={l.id}>
                  {gameById(l.gameId)?.title ?? l.gameId} <span className="muted">{formatDateTime(Date.parse(l.at), computer.timeZone)}</span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
