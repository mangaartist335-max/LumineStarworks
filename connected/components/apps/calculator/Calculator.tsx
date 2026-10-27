"use client";

import { useEffect, useReducer } from "react";
import { initialCalc, press, type CalcKey } from "@/lib/calculator";
import { useIsFocused } from "../common";
import type { AppProps } from "../registry";

const ROWS: { key: CalcKey; label: string; wide?: boolean; kind?: "op" | "mem" | "eq" }[][] = [
  [
    { key: "MC", label: "MC", kind: "mem" },
    { key: "MR", label: "MR", kind: "mem" },
    { key: "MS", label: "MS", kind: "mem" },
    { key: "M+", label: "M+", kind: "mem" },
    { key: "M-", label: "M−", kind: "mem" },
  ],
  [
    { key: "back", label: "←" },
    { key: "CE", label: "CE" },
    { key: "C", label: "C" },
    { key: "neg", label: "±" },
    { key: "sqrt", label: "√" },
  ],
  [
    { key: "7", label: "7" },
    { key: "8", label: "8" },
    { key: "9", label: "9" },
    { key: "÷", label: "/", kind: "op" },
    { key: "%", label: "%" },
  ],
  [
    { key: "4", label: "4" },
    { key: "5", label: "5" },
    { key: "6", label: "6" },
    { key: "×", label: "*", kind: "op" },
    { key: "recip", label: "1/x" },
  ],
  [
    { key: "1", label: "1" },
    { key: "2", label: "2" },
    { key: "3", label: "3" },
    { key: "-", label: "−", kind: "op" },
    { key: "=", label: "=", kind: "eq" },
  ],
  [
    { key: "0", label: "0", wide: true },
    { key: ".", label: "." },
    { key: "+", label: "+", kind: "op" },
  ],
];

const KEYMAP: Record<string, CalcKey> = { "+": "+", "-": "-", "*": "×", x: "×", "/": "÷", "=": "=", Enter: "=", Backspace: "back", Escape: "C", Delete: "CE", "%": "%", ".": ".", ",": "." };

export default function Calculator({ win }: AppProps) {
  const [s, dispatch] = useReducer(press, initialCalc);
  const focused = useIsFocused(win);

  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = /^[0-9]$/.test(e.key) ? (e.key as CalcKey) : KEYMAP[e.key];
      if (key) {
        e.preventDefault();
        dispatch(key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused]);

  return (
    <div className="calculator">
      <div className="calc-display" aria-live="polite">
        <div className="calc-pending">
          {s.memory !== 0 && <span className="calc-m">M</span>}
          {s.acc !== null && s.op ? `${s.acc} ${s.op}` : ""}
        </div>
        <output className="calc-value" aria-label="Result">
          {s.display}
        </output>
      </div>
      <div className="calc-keys">
        {ROWS.flat().map((b) => (
          <button key={b.key} className={`calc-key${b.kind ? ` ${b.kind}` : ""}${b.wide ? " wide" : ""}${b.key === "=" ? " tall" : ""}`} onClick={() => dispatch(b.key)} aria-label={b.key === "back" ? "Backspace" : b.label}>
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
