"use client";

// In-desktop dialogs (instead of the real browser's prompt/confirm), so they
// look like the rest of the computer and never block the page.

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Icon } from "./Icon";

interface DialogRequest {
  kind: "confirm" | "prompt" | "alert";
  title: string;
  message: string;
  value?: string;
  okLabel?: string;
  resolve: (v: string | boolean | null) => void;
}

interface DialogApi {
  confirm: (message: string, opts?: { title?: string; okLabel?: string }) => Promise<boolean>;
  prompt: (message: string, value?: string, opts?: { title?: string; okLabel?: string }) => Promise<string | null>;
  alert: (message: string, opts?: { title?: string }) => Promise<void>;
}

const DialogContext = createContext<DialogApi | null>(null);

export function useDialog(): DialogApi {
  const d = useContext(DialogContext);
  if (!d) throw new Error("useDialog outside DialogProvider");
  return d;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [req, setReq] = useState<DialogRequest | null>(null);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const open = useCallback((r: Omit<DialogRequest, "resolve">) => {
    return new Promise<string | boolean | null>((resolve) => {
      setValue(r.value ?? "");
      setReq({ ...r, resolve });
    });
  }, []);

  const api: DialogApi = {
    confirm: (message, o) => open({ kind: "confirm", title: o?.title ?? "Confirm", message, okLabel: o?.okLabel }).then(Boolean),
    prompt: (message, v, o) => open({ kind: "prompt", title: o?.title ?? "Enter a value", message, value: v, okLabel: o?.okLabel }).then((x) => (typeof x === "string" ? x : null)),
    alert: (message, o) => open({ kind: "alert", title: o?.title ?? "Notice", message }).then(() => undefined),
  };

  const close = (result: string | boolean | null) => {
    req?.resolve(result);
    setReq(null);
  };

  return (
    <DialogContext.Provider value={api}>
      {children}
      {req && (
        <div className="dialog-backdrop" onKeyDown={(e) => e.key === "Escape" && close(req.kind === "prompt" ? null : false)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <div className="titlebar">
              <span className="title" id="dialog-title">
                {req.title}
              </span>
            </div>
            <form
              className="dialog-body"
              onSubmit={(e) => {
                e.preventDefault();
                close(req.kind === "prompt" ? value : true);
              }}
            >
              <div className="row">
                <Icon name={req.kind === "confirm" ? "warning" : "info"} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ whiteSpace: "pre-wrap" }}>{req.message}</div>
                  {req.kind === "prompt" && (
                    <input
                      ref={inputRef}
                      className="field"
                      style={{ width: "100%", marginTop: 8 }}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      autoFocus
                      onFocus={(e) => {
                        const dot = e.target.value.lastIndexOf(".");
                        e.target.setSelectionRange(0, dot > 0 ? dot : e.target.value.length);
                      }}
                      aria-label={req.message}
                    />
                  )}
                </div>
              </div>
              <div className="dialog-actions">
                <button className="btn primary" autoFocus={req.kind !== "prompt"}>
                  {req.okLabel ?? "OK"}
                </button>
                {req.kind !== "alert" && (
                  <button type="button" className="btn" onClick={() => close(req.kind === "prompt" ? null : false)}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
