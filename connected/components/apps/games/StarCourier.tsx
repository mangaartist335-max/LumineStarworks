"use client";

// Star Courier (Tinybolt Games, 2012): fly parcels across an asteroid
// field. Grab packages, dodge rocks (the slow blue ones make good cover)
// and beat the Rock Crab on level 4 by delivering parcels at it.

import { useCallback, useEffect, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { gameById } from "@/data/games";
import { useArgs, useIsFocused } from "../common";
import type { AppProps } from "../registry";
import { COL, recordLaunch, useBeep, useGameRecords, useLibrary, type GameSave } from "./data";

const W = 800;
const H = 520;
const PARCELS_PER_LEVEL = 8;
const BOSS_HP = 8;
const LEVEL_SPEED = [0, 170, 220, 270, 230];
const SPAWN_MS = [0, 900, 700, 540, 1100];

interface Rock {
  x: number;
  y: number;
  r: number;
  vx: number;
  blue: boolean;
  spin: number;
}
interface Parcel {
  x: number;
  y: number;
  vx: number;
}
interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
}
interface Zap {
  x: number;
  y: number;
}

interface SaveData {
  level: number;
  score: number;
  lives: number;
}

interface World {
  ship: { x: number; y: number; invuln: number };
  rocks: Rock[];
  parcels: Parcel[];
  orbs: Orb[];
  zaps: Zap[];
  stars: { x: number; y: number; s: number }[];
  level: number;
  collected: number;
  score: number;
  lives: number;
  boss: { y: number; dir: number; hp: number; cooldown: number; hurt: number } | null;
  spawn: number;
  parcelSpawn: number;
  banner: { text: string; t: number } | null;
  state: "title" | "playing" | "paused" | "over" | "won";
  firstParcel: boolean;
}

function newWorld(save?: SaveData): World {
  return {
    ship: { x: 90, y: H / 2, invuln: 1.5 },
    rocks: [],
    parcels: [],
    orbs: [],
    zaps: [],
    stars: Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.6 + 0.3 })),
    level: save?.level ?? 1,
    collected: 0,
    score: save?.score ?? 0,
    lives: save?.lives ?? 3,
    boss: (save?.level ?? 1) === 4 ? { y: H / 2, dir: 1, hp: BOSS_HP, cooldown: 2, hurt: 0 } : null,
    spawn: 0,
    parcelSpawn: 1.2,
    banner: { text: (save?.level ?? 1) === 4 ? "Level 4: the Rock Crab!" : `Level ${save?.level ?? 1}`, t: 2 },
    state: "title",
    firstParcel: false,
  };
}

function drawShip(g: CanvasRenderingContext2D, x: number, y: number, blink: boolean) {
  if (blink) g.globalAlpha = 0.4;
  g.save();
  g.translate(x, y);
  // Flame
  g.fillStyle = `hsl(${30 + Math.random() * 20}, 100%, 60%)`;
  g.beginPath();
  g.moveTo(-22, -6);
  g.lineTo(-34 - Math.random() * 8, 0);
  g.lineTo(-22, 6);
  g.fill();
  // Body
  const body = g.createLinearGradient(0, -14, 0, 14);
  body.addColorStop(0, "#ffffff");
  body.addColorStop(1, "#9fb8d8");
  g.fillStyle = body;
  g.beginPath();
  g.moveTo(26, 0);
  g.quadraticCurveTo(10, -14, -22, -12);
  g.lineTo(-22, 12);
  g.quadraticCurveTo(10, 14, 26, 0);
  g.fill();
  g.strokeStyle = "#3a5578";
  g.lineWidth = 1.5;
  g.stroke();
  // Cockpit and stripe
  g.fillStyle = "#4fc3f7";
  g.beginPath();
  g.ellipse(8, -3, 7, 4, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ff8a3d";
  g.fillRect(-16, 3, 22, 4);
  // Wings
  g.fillStyle = "#ff8a3d";
  g.beginPath();
  g.moveTo(-8, -10);
  g.lineTo(-20, -22);
  g.lineTo(-22, -10);
  g.moveTo(-8, 10);
  g.lineTo(-20, 22);
  g.lineTo(-22, 10);
  g.fill();
  g.restore();
  g.globalAlpha = 1;
}

function drawParcel(g: CanvasRenderingContext2D, p: Parcel, t: number) {
  g.save();
  g.translate(p.x, p.y + Math.sin(t * 4 + p.x / 40) * 3);
  g.fillStyle = "#e8b04a";
  g.fillRect(-11, -9, 22, 18);
  g.strokeStyle = "#8a5a12";
  g.strokeRect(-11, -9, 22, 18);
  g.fillStyle = "#c0392b";
  g.fillRect(-2, -9, 4, 18);
  g.fillRect(-11, -2, 22, 4);
  g.restore();
}

function drawRock(g: CanvasRenderingContext2D, r: Rock) {
  g.save();
  g.translate(r.x, r.y);
  g.rotate(r.spin);
  const grad = g.createRadialGradient(-r.r / 3, -r.r / 3, 2, 0, 0, r.r);
  grad.addColorStop(0, r.blue ? "#9fd4ff" : "#b8aa9c");
  grad.addColorStop(1, r.blue ? "#2d6ea8" : "#5d5248");
  g.fillStyle = grad;
  g.beginPath();
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    const rr = r.r * (0.82 + ((k * 37) % 7) / 30);
    g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
  g.restore();
}

function drawBoss(g: CanvasRenderingContext2D, b: NonNullable<World["boss"]>, t: number) {
  const x = W - 90;
  g.save();
  g.translate(x, b.y);
  if (b.hurt > 0) g.globalAlpha = 0.6 + Math.sin(t * 40) * 0.3;
  g.fillStyle = "#7a5c4a";
  for (const side of [-1, 1]) {
    g.save();
    g.rotate(side * (0.3 + Math.sin(t * 3) * 0.15));
    g.fillRect(-70, side * 30 - 6, 40, 12);
    g.beginPath();
    g.arc(-74, side * 30, 14, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  const grad = g.createRadialGradient(-10, -10, 5, 0, 0, 55);
  grad.addColorStop(0, "#c79a7a");
  grad.addColorStop(1, "#5b3f2f");
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(0, 0, 55, 45, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#fff";
  g.beginPath();
  g.arc(-22, -14, 9, 0, Math.PI * 2);
  g.arc(-22, 14, 9, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#222";
  g.beginPath();
  g.arc(-25, -14, 4, 0, Math.PI * 2);
  g.arc(-25, 14, 4, 0, Math.PI * 2);
  g.fill();
  g.restore();
  // Health bar
  g.fillStyle = "rgba(0,0,0,.5)";
  g.fillRect(W / 2 - 120, 14, 240, 10);
  g.fillStyle = "#ff7043";
  g.fillRect(W / 2 - 120, 14, (240 * b.hp) / BOSS_HP, 10);
}

export default function StarCourier({ win }: AppProps) {
  const { store, user, now, dispatchWm } = useSystem();
  const focused = useIsFocused(win);
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<World>(newWorld());
  const keys = useRef(new Set<string>());
  const [ui, setUi] = useState<World["state"]>("title");
  const [hud, setHud] = useState({ score: 0, level: 1, lives: 3 });
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [saves] = useCollection<GameSave<SaveData>>(COL.saves);
  const { unlock, recordScore, save } = useGameRecords("game_star_courier");
  const { isInstalled } = useLibrary();
  const installed = isInstalled(gameById("game_star_courier")!);
  const beep = useBeep();
  const fx = useRef({ beep, unlock, recordScore, save });
  fx.current = { beep, unlock, recordScore, save };

  useArgs(win, async (args) => {
    if (user && !args.fromLauncher) void recordLaunch(store, user.id, "game_star_courier", now());
    if (typeof args.saveId === "string") {
      const s = await store.get<GameSave<SaveData>>(COL.saves, args.saveId);
      if (s) {
        world.current = newWorld(s.data);
        setHud({ score: s.data.score, level: s.data.level, lives: s.data.lives });
        setUi("title");
      }
    }
  });

  const setState = useCallback((s: World["state"]) => {
    world.current.state = s;
    setUi(s);
  }, []);

  const startLevel = useCallback((w: World, level: number) => {
    w.level = level;
    w.collected = 0;
    w.rocks = [];
    w.orbs = [];
    w.parcels = [];
    w.zaps = [];
    w.boss = level === 4 ? { y: H / 2, dir: 1, hp: BOSS_HP, cooldown: 2, hurt: 0 } : null;
    w.banner = { text: level === 4 ? "Level 4: the Rock Crab!" : `Level ${level}`, t: 2 };
    if (level >= 2) void fx.current.unlock("level_2");
    if (level >= 4) void fx.current.unlock("level_4");
    void fx.current.save("auto", `Level ${level} · ${w.score.toLocaleString("en-US")} points · ${w.lives} lives`, { level, score: w.score, lives: w.lives });
  }, []);

  // Keyboard.
  useEffect(() => {
    if (!focused) return;
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(k)) e.preventDefault();
      keys.current.add(k);
      const w = world.current;
      if ((k === "p" || k === "escape") && (w.state === "playing" || w.state === "paused")) setState(w.state === "playing" ? "paused" : "playing");
      if ((k === "enter" || k === " ") && (w.state === "title" || w.state === "over" || w.state === "won")) {
        if (w.state !== "title") world.current = newWorld();
        setState("playing");
        startLevel(world.current, world.current.level);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keys.current.clear();
    };
  }, [focused, setState, startLevel]);

  // Pause when the window loses focus.
  useEffect(() => {
    if (!focused && world.current.state === "playing") setState("paused");
  }, [focused, setState]);

  // Game loop.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let t = 0;
    let hudTimer = 0;
    const loop = (nowMs: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (nowMs - last) / 1000);
      last = nowMs;
      t += dt;
      const w = world.current;
      const c = canvas.current;
      if (!c) return;
      const g = c.getContext("2d")!;
      const playing = w.state === "playing";

      // Update
      for (const s of w.stars) {
        s.x -= s.s * (playing ? 60 : 15) * dt;
        if (s.x < 0) (s.x = W), (s.y = Math.random() * H);
      }
      if (playing) {
        const k = keys.current;
        const sp = 300;
        const sh = w.ship;
        if (k.has("arrowup") || k.has("w")) sh.y -= sp * dt;
        if (k.has("arrowdown") || k.has("s")) sh.y += sp * dt;
        if (k.has("arrowleft") || k.has("a")) sh.x -= sp * dt;
        if (k.has("arrowright") || k.has("d")) sh.x += sp * dt;
        sh.x = Math.max(30, Math.min(w.boss ? W - 220 : W - 300, sh.x));
        sh.y = Math.max(24, Math.min(H - 24, sh.y));
        sh.invuln = Math.max(0, sh.invuln - dt);
        w.score += Math.round(10 * dt * w.level * 10) / 10;

        const speed = LEVEL_SPEED[w.level];
        w.spawn -= dt * 1000;
        if (w.spawn <= 0) {
          w.spawn = SPAWN_MS[w.level] * (0.7 + Math.random() * 0.6);
          const blue = Math.random() < (w.boss ? 0.55 : 0.25);
          w.rocks.push({ x: W + 40, y: 30 + Math.random() * (H - 60), r: blue ? 26 + Math.random() * 10 : 14 + Math.random() * 14, vx: blue ? speed * 0.45 : speed * (0.8 + Math.random() * 0.5), blue, spin: Math.random() * 6 });
        }
        w.parcelSpawn -= dt;
        if (w.parcelSpawn <= 0) {
          w.parcelSpawn = w.boss ? 2.2 : 1.6 + Math.random();
          w.parcels.push({ x: w.boss ? W - 200 : W + 20, y: 40 + Math.random() * (H - 80), vx: speed * 0.6 });
        }
        for (const r of w.rocks) {
          r.x -= r.vx * dt;
          r.spin += dt * (r.blue ? 0.4 : 1.2);
        }
        for (const p of w.parcels) p.x -= p.vx * dt;
        w.rocks = w.rocks.filter((r) => r.x > -60);
        w.parcels = w.parcels.filter((p) => p.x > -30);

        // Boss
        if (w.boss) {
          const b = w.boss;
          b.y += b.dir * 90 * dt;
          if (b.y < 80 || b.y > H - 80) b.dir *= -1;
          b.cooldown -= dt;
          b.hurt = Math.max(0, b.hurt - dt);
          if (b.cooldown <= 0) {
            b.cooldown = 1.3;
            const dx = sh.x - (W - 140);
            const dy = sh.y - b.y;
            const len = Math.hypot(dx, dy) || 1;
            w.orbs.push({ x: W - 140, y: b.y, vx: (dx / len) * 230, vy: (dy / len) * 230 });
            fx.current.beep(220, 60, "sawtooth");
          }
          for (const o of w.orbs) {
            o.x += o.vx * dt;
            o.y += o.vy * dt;
          }
          // Blue rocks soak up the crab's shots.
          w.orbs = w.orbs.filter((o) => o.x > -20 && o.y > -20 && o.y < H + 20 && !w.rocks.some((r) => r.blue && Math.hypot(r.x - o.x, r.y - o.y) < r.r + 6));
          for (const z of w.zaps) z.x += 520 * dt;
          const hits = w.zaps.filter((z) => z.x > W - 150 && Math.abs(z.y - b.y) < 70);
          if (hits.length) {
            b.hp -= hits.length;
            b.hurt = 0.4;
            w.score += 300 * hits.length;
            fx.current.beep(660, 120, "triangle");
          }
          w.zaps = w.zaps.filter((z) => !hits.includes(z) && z.x < W + 20);
          if (b.hp <= 0) {
            w.score += 2000;
            setState("won");
            void fx.current.unlock("victory");
            void fx.current.recordScore(Math.round(w.score), "Mission complete");
            fx.current.beep(523, 150, "triangle");
            setTimeout(() => fx.current.beep(784, 300, "triangle"), 160);
          }
        }

        // Collisions
        for (const p of [...w.parcels]) {
          if (Math.abs(p.x - sh.x) < 28 && Math.abs(p.y - sh.y) < 22) {
            w.parcels.splice(w.parcels.indexOf(p), 1);
            w.collected++;
            w.score += 100 * w.level;
            fx.current.beep(990, 70, "square");
            if (!w.firstParcel) {
              w.firstParcel = true;
              void fx.current.unlock("first_parcel");
            }
            if (w.boss) w.zaps.push({ x: sh.x + 20, y: sh.y });
            else if (w.collected >= PARCELS_PER_LEVEL && w.level < 4) startLevel(w, w.level + 1);
          }
        }
        if (w.score >= 5000) void fx.current.unlock("score_5000");
        if (sh.invuln <= 0) {
          const hitRock = w.rocks.find((r) => Math.hypot(r.x - sh.x, r.y - sh.y) < r.r + 12);
          const hitOrb = w.orbs.find((o) => Math.hypot(o.x - sh.x, o.y - sh.y) < 16);
          if (hitRock || hitOrb) {
            if (hitOrb) w.orbs.splice(w.orbs.indexOf(hitOrb), 1);
            w.lives--;
            sh.invuln = 2;
            fx.current.beep(110, 200, "sawtooth");
            if (w.lives <= 0) {
              setState("over");
              void fx.current.recordScore(Math.round(w.score), `Reached level ${w.level}`);
            }
          }
        }
        if (w.banner) {
          w.banner.t -= dt;
          if (w.banner.t <= 0) w.banner = null;
        }
        hudTimer += dt;
        if (hudTimer > 0.2) {
          hudTimer = 0;
          setHud({ score: Math.round(w.score), level: w.level, lives: w.lives });
        }
      }

      // Draw
      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0b1030");
      bg.addColorStop(1, "#1c1446");
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);
      for (const s of w.stars) {
        g.fillStyle = `rgba(255,255,255,${0.3 + s.s / 3})`;
        g.fillRect(s.x, s.y, s.s, s.s);
      }
      for (const r of w.rocks) drawRock(g, r);
      for (const p of w.parcels) drawParcel(g, p, t);
      for (const z of w.zaps) {
        g.fillStyle = "#e8b04a";
        g.fillRect(z.x - 8, z.y - 6, 16, 12);
      }
      g.fillStyle = "#ff5252";
      for (const o of w.orbs) {
        g.beginPath();
        g.arc(o.x, o.y, 7, 0, Math.PI * 2);
        g.fill();
      }
      if (w.boss) drawBoss(g, w.boss, t);
      drawShip(g, w.ship.x, w.ship.y, w.ship.invuln > 0 && Math.floor(t * 10) % 2 === 0);
      if (w.banner && playing) {
        g.fillStyle = "rgba(255,255,255,.9)";
        g.font = "bold 34px Arial, sans-serif";
        g.textAlign = "center";
        g.fillText(w.banner.text, W / 2, H / 2 - 40);
        g.textAlign = "left";
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [setState, startLevel]);

  const begin = () => {
    const w = world.current;
    if (w.state !== "title") world.current = newWorld();
    setState("playing");
    startLevel(world.current, world.current.level);
    canvas.current?.focus();
  };

  const slotSaves = [1, 2, 3].map((n) => saves.find((s) => s.gameId === "game_star_courier" && s.slot === String(n)));

  if (!installed) {
    return (
      <div className="starcourier">
        <div className="sc-overlay">
          <h1>Star Courier</h1>
          <p>Star Courier isn&apos;t installed on this computer. You can get it free from Freeware Corner.</p>
          <button className="btn" onClick={() => dispatchWm({ type: "close", id: win.id })}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="starcourier">
      <div className="sc-hud">
        <span>Score {hud.score.toLocaleString("en-US")}</span>
        <span>Level {hud.level}</span>
        <span>{"♥".repeat(Math.max(0, hud.lives))}</span>
        <span className="muted">Arrows/WASD to fly · P to pause</span>
      </div>
      <div className="sc-stage">
        <canvas ref={canvas} width={W} height={H} tabIndex={0} aria-label="Star Courier game" data-state={ui} />
        {ui !== "playing" && (
          <div className="sc-overlay">
            {ui === "title" && (
              <>
                <h1>Star Courier</h1>
                <p>Collect {PARCELS_PER_LEVEL} parcels to finish each level. On level 4, deliver parcels at the Rock Crab to beat it. Hide behind blue rocks!</p>
                <button className="btn primary" onClick={begin} autoFocus>
                  {world.current.level > 1 || world.current.score > 0 ? `Continue from level ${world.current.level}` : "Start game"}
                </button>
              </>
            )}
            {ui === "paused" && (
              <>
                <h1>Paused</h1>
                <button className="btn primary" onClick={() => (setState("playing"), canvas.current?.focus())} autoFocus>
                  Resume
                </button>
                <div className="sc-slots">
                  {slotSaves.map((s, i) => (
                    <button
                      key={i}
                      className="btn"
                      onClick={async () => {
                        const w = world.current;
                        await save(String(i + 1), `Level ${w.level} · ${Math.round(w.score).toLocaleString("en-US")} points · ${w.lives} lives`, { level: w.level, score: Math.round(w.score), lives: w.lives });
                        setSavedMsg(`Saved in slot ${i + 1}. (Loading starts you at the beginning of level ${w.level}.)`);
                      }}
                    >
                      Save in slot {i + 1}
                      {s ? " (replace)" : ""}
                    </button>
                  ))}
                </div>
                {savedMsg && <p role="status">{savedMsg}</p>}
                <button className="btn" onClick={() => dispatchWm({ type: "close", id: win.id })}>
                  Quit
                </button>
              </>
            )}
            {ui === "over" && (
              <>
                <h1>Out of lives!</h1>
                <p>
                  You scored {hud.score.toLocaleString("en-US")} points and reached level {hud.level}. Nice flying!
                </p>
                <button className="btn primary" onClick={begin} autoFocus>
                  Play again
                </button>
              </>
            )}
            {ui === "won" && (
              <>
                <h1>Mission complete! 🎉</h1>
                <p>The Rock Crab is beaten and every parcel got delivered. Final score: {Math.round(world.current.score).toLocaleString("en-US")}.</p>
                <button className="btn primary" onClick={begin} autoFocus>
                  Play again
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
