"use client";

import { useEffect, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useUserValue } from "@/components/system/hooks";
import { chord, DIFFICULTIES, flagsLeft, newBoard, reveal, toggleMark, type Board, type Difficulty } from "@/lib/fieldsweeper";
import type { AppProps } from "../registry";
import { recordLaunch, useBeep, useGameRecords } from "./data";
import { useArgs } from "../common";

const fresh = (d: Difficulty) => newBoard(DIFFICULTIES[d].rows, DIFFICULTIES[d].cols, DIFFICULTIES[d].thistles);
const COLORS = ["", "#0000ff", "#007b00", "#ff0000", "#00007b", "#7b0000", "#007b7b", "#000", "#7b7b7b"];

export default function FieldSweeper({ win }: AppProps) {
  const { store, user, now } = useSystem();
  const [difficulty, setDifficulty] = useUserValue<Difficulty>("fieldsweeper-difficulty", "beginner");
  const [board, setBoard] = useState<Board>(() => fresh("beginner"));
  const [started, setStarted] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [pressing, setPressing] = useState(false);
  const { unlock, recordScore } = useGameRecords("game_field_sweeper");
  const beep = useBeep();
  // The finished board whose result was already recorded.
  const recorded = useRef<Board | null>(null);
  const [boardFor, setBoardFor] = useState<Difficulty>("beginner");

  // Opening the game straight from Freeware Corner or the Start menu counts as a launch.
  useArgs(win, (args) => {
    if (user && !args.fromLauncher) void recordLaunch(store, user.id, "game_field_sweeper", now());
  });

  const restart = (d: Difficulty = difficulty) => {
    setBoard(fresh(d));
    setStarted(null);
    setElapsed(0);
  };

  // A new board whenever the difficulty changes (including when the saved choice loads).
  if (boardFor !== difficulty) {
    setBoardFor(difficulty);
    restart(difficulty);
  }

  useEffect(() => {
    if (started === null || board.state !== "playing") return;
    const t = setInterval(() => setElapsed(Math.min(999, Math.floor((Date.now() - started) / 1000))), 250);
    return () => clearInterval(t);
  }, [started, board.state]);

  useEffect(() => {
    if (recorded.current === board || (board.state !== "won" && board.state !== "lost")) return;
    recorded.current = board;
    const secs = started ? Math.max(1, Math.round((Date.now() - started) / 1000)) : 1;
    setElapsed(Math.min(999, secs));
    if (board.state === "won") {
      beep(880, 120, "triangle");
      setTimeout(() => beep(1320, 160, "triangle"), 130);
      void recordScore(secs, DIFFICULTIES[difficulty].label);
      void unlock("first_win");
      if (secs < 60) void unlock("fast_win");
      if (difficulty === "expert") void unlock("expert_win");
    } else beep(140, 260, "sawtooth");
  }, [board, started, difficulty, beep, recordScore, unlock]);

  const click = (i: number, at: number) => {
    if (board.state === "won" || board.state === "lost") return;
    if (started === null) setStarted(at);
    const c = board.cells[i];
    const next = c.open ? chord(board, i) : reveal(board, i);
    if (next !== board && next.state === "playing") beep(520, 30);
    setBoard(next);
  };

  const face = board.state === "won" ? "😎" : board.state === "lost" ? "🙃" : pressing ? "😮" : "🙂";

  return (
    <div className="sweeper" onContextMenu={(e) => e.preventDefault()}>
      <div className="toolbar">
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
          <button key={d} className="tool" aria-pressed={difficulty === d} onClick={() => (difficulty === d ? restart(d) : setDifficulty(d))}>
            {DIFFICULTIES[d].label}
          </button>
        ))}
      </div>
      <div className="sw-frame">
        <div className="sw-top">
          <span className="sw-led" aria-label="Thistles left">
            {String(Math.max(-99, flagsLeft(board))).padStart(3, "0")}
          </span>
          <button className="sw-face" onClick={() => restart()} aria-label="New game">
            {face}
          </button>
          <span className="sw-led" aria-label="Seconds">
            {String(elapsed).padStart(3, "0")}
          </span>
        </div>
        <div className="sw-grid" style={{ gridTemplateColumns: `repeat(${board.cols}, 22px)` }} onMouseDown={() => setPressing(true)} onMouseUp={() => setPressing(false)} onMouseLeave={() => setPressing(false)} role="grid" aria-label="Field">
          {board.cells.map((c, i) => (
            <button
              key={i}
              className={`sw-cell${c.open ? " open" : ""}${board.hit === i ? " hit" : ""}`}
              onClick={(e) => click(i, performance.timeOrigin + e.timeStamp)}
              onContextMenu={(e) => {
                e.preventDefault();
                setBoard(toggleMark(board, i));
              }}
              style={c.open && c.near && !c.thistle ? { color: COLORS[c.near] } : undefined}
              aria-label={c.open ? (c.thistle ? "thistle" : String(c.near || "empty")) : c.mark === "flag" ? "flagged" : "hidden"}
              data-i={i}
            >
              {c.open ? (c.thistle ? "✿" : c.near || "") : c.mark === "flag" ? "🚩" : c.mark === "question" ? "?" : ""}
            </button>
          ))}
        </div>
      </div>
      <div className="statusbar">
        <span>{board.state === "won" ? `You cleared the field in ${elapsed} seconds!` : board.state === "lost" ? "Ouch, a thistle! Click the face to try again." : "Left-click to clear a square, right-click to flag a thistle."}</span>
      </div>
    </div>
  );
}
