"use client";

// Notepad: open, edit and save plain text files.

import { useEffect, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useUserValue } from "@/components/system/hooks";
import { useDialog } from "@/components/desktop/Dialogs";
import { formatDateTime } from "@/lib/time";
import { FileDialog, isText, useArgs, useFiles, useIsFocused, useWindowTitle } from "../common";
import type { AppProps } from "../registry";

export default function Notepad({ win }: AppProps) {
  const { vfs, now, computer } = useSystem();
  const dialog = useDialog();
  const files = useFiles();
  const focused = useIsFocused(win);
  const [prefs, setPrefs] = useUserValue<{ wrap: boolean; size: number }>("notepad-prefs", { wrap: true, size: 13 });
  const [fileId, setFileId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState("");
  const [picker, setPicker] = useState<"open" | "save" | null>(null);
  const [find, setFind] = useState<string | null>(null);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const area = useRef<HTMLTextAreaElement>(null);
  const file = files.find((f) => f.id === fileId);
  const dirty = text !== saved;
  useWindowTitle(win, `${dirty ? "*" : ""}${file?.name ?? "Untitled"} - Notepad`);

  const load = async (id: string) => {
    if (!vfs) return;
    try {
      const t = await vfs.readText(id);
      setFileId(id);
      setText(t);
      setSaved(t);
    } catch (e) {
      await dialog.alert(e instanceof Error ? e.message : String(e), { title: "Notepad" });
    }
  };

  useArgs(win, (args) => {
    if (typeof args.fileId === "string") void load(args.fileId);
  });

  const keepChanges = async () => !dirty || (await dialog.confirm(`Do you want to discard your changes to ${file?.name ?? "Untitled"}?`, { title: "Notepad", okLabel: "Discard" }));

  const save = async (as = false) => {
    if (!vfs) return;
    if (!fileId || as) {
      setPicker("save");
      return;
    }
    await vfs.updateFile(fileId, text);
    setSaved(text);
  };

  const findNext = (q: string) => {
    const el = area.current;
    if (!el || !q) return;
    const from = el.selectionEnd;
    let i = text.toLowerCase().indexOf(q.toLowerCase(), from);
    if (i < 0) i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return void dialog.alert(`Cannot find "${q}"`, { title: "Notepad" });
    el.focus();
    el.setSelectionRange(i, i + q.length);
  };

  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === "s") (e.preventDefault(), void save(e.shiftKey));
      else if (mod && k === "o") (e.preventDefault(), void keepChanges().then((ok) => ok && setPicker("open")));
      else if (mod && k === "f") (e.preventDefault(), setFind(find ?? ""));
      else if (mod && k === "n") (e.preventDefault(), void keepChanges().then((ok) => ok && (setFileId(null), setText(""), setSaved(""))));
      else if (e.key === "F3" && find) (e.preventDefault(), findNext(find));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const trackCursor = () => {
    const el = area.current;
    if (!el) return;
    const before = el.value.slice(0, el.selectionStart);
    const lines = before.split("\n");
    setCursor({ line: lines.length, col: lines[lines.length - 1].length + 1 });
  };

  return (
    <div className="notepad">
      <div className="toolbar">
        <button className="tool" onClick={async () => (await keepChanges()) && (setFileId(null), setText(""), setSaved(""))}>
          New
        </button>
        <button className="tool" onClick={async () => (await keepChanges()) && setPicker("open")}>
          Open...
        </button>
        <button className="tool" onClick={() => save()}>
          Save
        </button>
        <button className="tool" onClick={() => save(true)}>
          Save As...
        </button>
        <span className="ph-sep" />
        <button className="tool" onClick={() => setFind(find === null ? "" : null)} aria-pressed={find !== null}>
          Find
        </button>
        <button className="tool" aria-pressed={prefs.wrap} onClick={() => setPrefs({ ...prefs, wrap: !prefs.wrap })}>
          Word wrap
        </button>
        <button className="tool" onClick={() => setPrefs({ ...prefs, size: Math.max(9, prefs.size - 1) })} aria-label="Smaller text">
          A−
        </button>
        <button className="tool" onClick={() => setPrefs({ ...prefs, size: Math.min(28, prefs.size + 1) })} aria-label="Bigger text">
          A+
        </button>
        <button
          className="tool"
          onClick={() => {
            const el = area.current;
            if (!el) return;
            const stamp = formatDateTime(now(), computer.timeZone);
            const next = text.slice(0, el.selectionStart) + stamp + text.slice(el.selectionEnd);
            setText(next);
          }}
          title="Insert the time and date"
        >
          Time/Date
        </button>
        {find !== null && (
          <form
            className="np-find"
            onSubmit={(e) => {
              e.preventDefault();
              findNext(find);
            }}
          >
            <input className="field" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Find what" autoFocus aria-label="Find what" />
            <button className="btn">Find next</button>
          </form>
        )}
      </div>
      <textarea
        ref={area}
        className="np-text"
        value={text}
        onChange={(e) => (setText(e.target.value), trackCursor())}
        onKeyUp={trackCursor}
        onClick={trackCursor}
        spellCheck={false}
        wrap={prefs.wrap ? "soft" : "off"}
        style={{ fontSize: prefs.size, whiteSpace: prefs.wrap ? "pre-wrap" : "pre" }}
        aria-label="Text"
      />
      <div className="statusbar">
        <span>
          Ln {cursor.line}, Col {cursor.col}
        </span>
        <span>{text.length} characters</span>
        {file && <span>{file.name}</span>}
        {dirty && <span>Unsaved changes</span>}
      </div>
      {picker && (
        <FileDialog
          mode={picker}
          title={picker === "open" ? "Open" : "Save As"}
          accept={isText}
          defaultName={file?.name ?? "Untitled.txt"}
          startIn={file?.parentId ?? "documents"}
          onClose={async (r) => {
            setPicker(null);
            if (!r || !vfs) return;
            if (picker === "open") return void load(r.files[0].id);
            const name = /\.[a-z0-9]+$/i.test(r.name!) ? r.name! : `${r.name}.txt`;
            const existing = files.find((f) => f.parentId === r.folderId && f.name.toLowerCase() === name.toLowerCase() && f.kind === "file");
            if (existing) {
              if (!(await dialog.confirm(`${name} already exists.\nDo you want to replace it?`, { title: "Confirm Save As", okLabel: "Yes" }))) return;
              await vfs.updateFile(existing.id, text);
              setFileId(existing.id);
            } else {
              const node = await vfs.writeFile(r.folderId, name, text, { mime: "text/plain" });
              setFileId(node.id);
            }
            setSaved(text);
          }}
        />
      )}
    </div>
  );
}
