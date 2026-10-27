"use client";

// Records the Games program and the games share: what's installed, launch
// history, saves, high scores and achievements, plus little sound effects.

import { useCallback } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection, useUserValue } from "@/components/system/hooks";
import { gameById, games, type GameInfo } from "@/data/games";
import { isAvailable } from "@/lib/availability";
import { newId } from "@/lib/ids";
import { iso } from "@/lib/time";

export interface Installed {
  id: string;
  owner: string;
  gameId: string;
  installedAt: string;
}
export interface Launch {
  id: string;
  owner: string;
  gameId: string;
  at: string;
}
export interface Unlock {
  id: string;
  owner: string;
  gameId: string;
  achievementId: string;
  at: string;
}
export interface GameSave<T = unknown> {
  id: string;
  owner: string;
  gameId: string;
  slot: string;
  label: string;
  data: T;
  at: string;
  origin: "user";
}
export interface Score {
  id: string;
  owner: string;
  gameId: string;
  score: number;
  detail: string;
  at: string;
}

export const COL = { installed: "games.installed", launches: "games.launches", unlocks: "games.achievements", saves: "games.saves", scores: "games.scores" };

export interface GameSettings {
  sound: boolean;
}

export function useGameSettings() {
  return useUserValue<GameSettings>("games-settings", { sound: true });
}

export function useLibrary() {
  const { now, computer } = useSystem();
  const [installed] = useCollection<Installed>(COL.installed);
  const t = now();
  const released = (g: GameInfo) => isAvailable(g.availability, t, computer.region);
  const isInstalled = (g: GameInfo) => released(g) && (g.builtIn || installed.some((i) => i.gameId === g.id));
  return { games, released, isInstalled, installed };
}

/** Achievements, scores and saves for one game, with helpers to record them. */
export function useGameRecords(gameId: string) {
  const { store, user, now, notify } = useSystem();
  const [unlocks] = useCollection<Unlock>(COL.unlocks);
  const game = gameById(gameId)!;

  const unlock = useCallback(
    async (achievementId: string) => {
      if (!user) return;
      const id = `${user.id}:${gameId}:${achievementId}`;
      if (await store.get(COL.unlocks, id)) return;
      await store.put<Unlock>(COL.unlocks, { id, owner: user.id, gameId, achievementId, at: iso(now()) });
      const a = game.achievements.find((x) => x.id === achievementId);
      if (a) notify({ title: `Achievement unlocked: ${a.title}`, body: a.description, icon: "games" });
    },
    [store, user, now, notify, gameId, game],
  );

  const recordScore = useCallback(
    async (score: number, detail: string) => {
      if (!user) return;
      await store.put<Score>(COL.scores, { id: newId("game"), owner: user.id, gameId, score, detail, at: iso(now()) });
    },
    [store, user, now, gameId],
  );

  const save = useCallback(
    async <T,>(slot: string, label: string, data: T) => {
      if (!user) return;
      await store.put<GameSave<T>>(COL.saves, { id: `${user.id}:${gameId}:${slot}`, owner: user.id, gameId, slot, label, data, at: iso(now()), origin: "user" });
    },
    [store, user, now, gameId],
  );

  return { game, unlocks: unlocks.filter((u) => u.gameId === gameId), unlock, recordScore, save };
}

export async function recordLaunch(store: ReturnType<typeof useSystem>["store"], owner: string, gameId: string, at: number) {
  await store.put<Launch>(COL.launches, { id: newId("game"), owner, gameId, at: iso(at) });
}

/** A short beep for game sound effects, at the computer's volume. */
export function useBeep() {
  const { settings } = useSystem();
  const [prefs] = useGameSettings();
  return useCallback(
    (freq: number, ms = 90, type: OscillatorType = "square") => {
      if (!prefs.sound || settings.muted || settings.volume === 0) return;
      try {
        const ctx = (beepCtx ??= new AudioContext());
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = 0.06 * settings.volume;
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + ms / 1000);
      } catch {
        // Sound is a nice extra; the game works without it.
      }
    },
    [prefs.sound, settings.muted, settings.volume],
  );
}
let beepCtx: AudioContext | null = null;
