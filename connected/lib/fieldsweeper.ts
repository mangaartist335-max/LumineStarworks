// Field Sweeper's rules: a grid with hidden thistles, numbers that count
// neighbouring thistles, a safe first click, flags and chording.

export interface Cell {
  thistle: boolean;
  open: boolean;
  mark: "none" | "flag" | "question";
  near: number;
}

export interface Board {
  rows: number;
  cols: number;
  thistles: number;
  cells: Cell[];
  /** Thistles are placed on the first click, so it's always safe. */
  seeded: boolean;
  state: "ready" | "playing" | "won" | "lost";
  hit?: number;
}

export const DIFFICULTIES = {
  beginner: { label: "Beginner", rows: 9, cols: 9, thistles: 10 },
  intermediate: { label: "Intermediate", rows: 16, cols: 16, thistles: 40 },
  expert: { label: "Expert", rows: 16, cols: 30, thistles: 99 },
} as const;
export type Difficulty = keyof typeof DIFFICULTIES;

export function newBoard(rows: number, cols: number, thistles: number): Board {
  return { rows, cols, thistles, cells: Array.from({ length: rows * cols }, () => ({ thistle: false, open: false, mark: "none", near: 0 })), seeded: false, state: "ready" };
}

export function neighbours(b: Pick<Board, "rows" | "cols">, i: number): number[] {
  const r = Math.floor(i / b.cols);
  const c = i % b.cols;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < b.rows && cc >= 0 && cc < b.cols) out.push(rr * b.cols + cc);
    }
  return out;
}

/** Places thistles away from the first click (and its neighbours when there's room). */
export function seed(b: Board, safe: number, random: () => number = Math.random): Board {
  const keepClear = new Set([safe, ...(b.rows * b.cols - b.thistles >= 9 ? neighbours(b, safe) : [])]);
  const spots = b.cells.map((_, i) => i).filter((i) => !keepClear.has(i));
  for (let i = spots.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [spots[i], spots[j]] = [spots[j], spots[i]];
  }
  const mines = new Set(spots.slice(0, b.thistles));
  const cells = b.cells.map((c, i) => ({ ...c, thistle: mines.has(i) }));
  for (let i = 0; i < cells.length; i++) cells[i].near = neighbours(b, i).filter((n) => cells[n].thistle).length;
  return { ...b, cells, seeded: true, state: "playing" };
}

function checkWin(b: Board): Board {
  const done = b.cells.every((c) => c.thistle || c.open);
  if (!done) return b;
  return { ...b, state: "won", cells: b.cells.map((c) => (c.thistle ? { ...c, mark: "flag" } : c)) };
}

export function reveal(b0: Board, i: number, random?: () => number): Board {
  if (b0.state === "won" || b0.state === "lost") return b0;
  let b = b0.seeded ? b0 : seed(b0, i, random);
  const start = b.cells[i];
  if (start.open || start.mark === "flag") return b;
  const cells = b.cells.map((c) => ({ ...c }));
  if (cells[i].thistle) {
    for (const c of cells) if (c.thistle) c.open = true;
    return { ...b, cells, state: "lost", hit: i };
  }
  const stack = [i];
  while (stack.length) {
    const k = stack.pop()!;
    const c = cells[k];
    if (c.open || c.mark === "flag") continue;
    c.open = true;
    c.mark = "none";
    if (c.near === 0) for (const n of neighbours(b, k)) if (!cells[n].open) stack.push(n);
  }
  b = { ...b, cells };
  return checkWin(b);
}

/** Clicking an open number whose flags are all placed opens the rest of its neighbours. */
export function chord(b: Board, i: number): Board {
  const c = b.cells[i];
  if (!c.open || c.near === 0 || b.state !== "playing") return b;
  const around = neighbours(b, i);
  if (around.filter((n) => b.cells[n].mark === "flag").length !== c.near) return b;
  let next = b;
  for (const n of around) if (!next.cells[n].open && next.cells[n].mark !== "flag") next = reveal(next, n);
  return next;
}

export function toggleMark(b: Board, i: number): Board {
  const c = b.cells[i];
  if (c.open || b.state === "won" || b.state === "lost") return b;
  const mark: Cell["mark"] = c.mark === "none" ? "flag" : c.mark === "flag" ? "question" : "none";
  return { ...b, cells: b.cells.map((x, k) => (k === i ? { ...x, mark } : x)) };
}

export const flagsLeft = (b: Board) => b.thistles - b.cells.filter((c) => c.mark === "flag").length;
