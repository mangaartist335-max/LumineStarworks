// The Calculator's brain: a standard pocket-calculator state machine
// (enter a number, an operator, another number, =), kept pure for tests.

export type Op = "+" | "-" | "×" | "÷";

export interface CalcState {
  display: string;
  acc: number | null;
  op: Op | null;
  /** The next digit starts a new number. */
  fresh: boolean;
  memory: number;
  error: boolean;
  lastOp: { op: Op; operand: number } | null;
}

export const initialCalc: CalcState = { display: "0", acc: null, op: null, fresh: true, memory: 0, error: false, lastOp: null };

export type CalcKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "." | Op | "=" | "C" | "CE" | "back" | "neg" | "%" | "sqrt" | "recip" | "MC" | "MR" | "M+" | "M-" | "MS";

function apply(a: number, op: Op, b: number): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
  }
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "Cannot divide by zero";
  if (Math.abs(n) >= 1e16 || (Math.abs(n) < 1e-10 && n !== 0)) return n.toExponential(10).replace(/\.?0+e/, "e");
  return String(parseFloat(n.toPrecision(16)));
}

const value = (s: CalcState) => parseFloat(s.display);

function result(s: CalcState, n: number): CalcState {
  if (!Number.isFinite(n)) return { ...s, display: "Cannot divide by zero", acc: null, op: null, fresh: true, error: true };
  return { ...s, display: formatNumber(n), fresh: true, error: false };
}

export function press(s: CalcState, key: CalcKey): CalcState {
  if (s.error && key !== "C" && key !== "CE") s = { ...initialCalc, memory: s.memory };
  if (/^[0-9]$/.test(key)) {
    if (s.fresh) return { ...s, display: key, fresh: false };
    if (s.display.replace(/[-.]/g, "").length >= 16) return s;
    return { ...s, display: s.display === "0" ? key : s.display + key };
  }
  switch (key) {
    case ".":
      if (s.fresh) return { ...s, display: "0.", fresh: false };
      return s.display.includes(".") ? s : { ...s, display: `${s.display}.` };
    case "+":
    case "-":
    case "×":
    case "÷": {
      if (s.op && s.acc !== null && !s.fresh) {
        const r = apply(s.acc, s.op, value(s));
        const next = result(s, r);
        return next.error ? next : { ...next, acc: r, op: key, lastOp: null };
      }
      return { ...s, acc: value(s), op: key, fresh: true, lastOp: null };
    }
    case "=": {
      if (s.op && s.acc !== null) {
        const operand = s.fresh && s.lastOp ? s.lastOp.operand : value(s);
        const r = apply(s.acc, s.op, operand);
        return { ...result(s, r), acc: null, op: null, lastOp: { op: s.op, operand } };
      }
      if (s.lastOp) return { ...result(s, apply(value(s), s.lastOp.op, s.lastOp.operand)) };
      return { ...s, fresh: true };
    }
    case "C":
      return { ...initialCalc, memory: s.memory };
    case "CE":
      return { ...s, display: "0", fresh: true, error: false };
    case "back":
      if (s.fresh) return s;
      return { ...s, display: s.display.length > 1 && !(s.display.length === 2 && s.display.startsWith("-")) ? s.display.slice(0, -1) : "0" };
    case "neg":
      return s.display === "0" ? s : { ...s, display: s.display.startsWith("-") ? s.display.slice(1) : `-${s.display}` };
    case "%":
      // Windows style: 50 + 10% = 55.
      return result(s, s.acc !== null ? (s.acc * value(s)) / 100 : value(s) / 100);
    case "sqrt":
      return value(s) < 0 ? { ...s, display: "Invalid input", fresh: true, error: true } : result(s, Math.sqrt(value(s)));
    case "recip":
      return result(s, value(s) === 0 ? NaN : 1 / value(s));
    case "MC":
      return { ...s, memory: 0 };
    case "MR":
      return { ...s, display: formatNumber(s.memory), fresh: true };
    case "MS":
      return { ...s, memory: value(s), fresh: true };
    case "M+":
      return { ...s, memory: s.memory + value(s), fresh: true };
    case "M-":
      return { ...s, memory: s.memory - value(s), fresh: true };
  }
  return s;
}
