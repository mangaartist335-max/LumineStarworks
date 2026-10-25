"use client";

// ConnectMail: folders, reading, writing, replying and forwarding, drafts
// that save themselves, attachments from your computer, and search.

import { useEffect, useMemo, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { useDialog } from "@/components/desktop/Dialogs";
import { Icon } from "@/components/desktop/Icon";
import { COL_MAIL, COL_MAIL_FOLDERS, formatAddresses, matchesSearch, parseAddresses, quoteBody, replySubject, sendMail, SYSTEM_FOLDERS, type MailAttachment, type MailFolder, type MailMessage } from "@/lib/mail";
import { tokenize } from "@/lib/messenger";
import { newId } from "@/lib/ids";
import { formatDateTime, formatShortDate, formatTime, iso } from "@/lib/time";
import { formatSize } from "@/lib/vfs";
import { appForFile, iconForFile } from "../catalog";
import { FileDialog, useArgs, useWindowTitle } from "../common";
import type { AppProps } from "../registry";

interface Draft {
  id: string;
  to: string;
  cc: string;
  subject: string;
  body: string;
  attachments: MailAttachment[];
  inReplyTo?: string;
}

const emptyDraft = (): Draft => ({ id: newId("mail"), to: "", cc: "", subject: "", body: "", attachments: [] });

function MailBody({ text }: { text: string }) {
  const { openApp } = useSystem();
  return (
    <div className="ml-body">
      {tokenize(text).map((t, i) =>
        t.kind === "link" ? (
          <a key={i} href={t.url} onClick={(e) => (e.preventDefault(), openApp("browser", { url: t.url }))}>
            {t.text}
          </a>
        ) : (
          <span key={i}>{t.kind === "text" ? t.text : t.code}</span>
        ),
      )}
    </div>
  );
}

export default function Mail({ win }: AppProps) {
  const sys = useSystem();
  const { store, user, users, now, computer, vfs, folders: fsFolders, openApp, notify } = sys;
  const dialog = useDialog();
  const [mail] = useCollection<MailMessage>(COL_MAIL);
  const [custom] = useCollection<MailFolder>(COL_MAIL_FOLDERS);
  const [folder, setFolder] = useState("inbox");
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [picking, setPicking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accounts = users.map((u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt }));
  const fmt = (t: number) => formatDateTime(t, computer.timeZone);

  const list = useMemo(
    () =>
      mail
        .filter((m) => (query ? m.folder !== "trash" || folder === "trash" : m.folder === folder) && matchesSearch(m, query))
        .sort((a, b) => b.at.localeCompare(a.at)),
    [mail, folder, query],
  );
  const open = mail.find((m) => m.id === openId) ?? null;
  const unread = (f: string) => mail.filter((m) => m.folder === f && !m.read).length;
  const allFolders = [...SYSTEM_FOLDERS.map((f) => ({ id: f.id, label: f.label })), ...custom.map((f) => ({ id: f.id, label: f.name }))];
  const folderLabel = allFolders.find((f) => f.id === folder)?.label ?? "Mail";
  useWindowTitle(win, draft ? `${draft.subject || "New message"} - Mail` : `${folderLabel}${unread("inbox") ? ` (${unread("inbox")})` : ""} - Mail`);

  const attachFiles = async (ids: string[]): Promise<MailAttachment[]> => {
    if (!vfs) return [];
    const out: MailAttachment[] = [];
    for (const id of ids) {
      const node = await vfs.get(id);
      if (!node || node.kind !== "file") continue;
      const blob = await vfs.readBlob(id);
      const blobId = newId("blob");
      await store.putBlob(blobId, blob);
      out.push({ id: newId("att"), name: node.name, mime: node.mime ?? "application/octet-stream", size: blob.size, blobId });
    }
    return out;
  };

  useArgs(win, async (args) => {
    const c = args.compose as { to?: string; subject?: string; body?: string; attach?: string[] } | undefined;
    if (c) {
      const d = { ...emptyDraft(), to: c.to ?? "", subject: c.subject ?? "", body: c.body ?? "" };
      setDraft(d);
      if (c.attach?.length) {
        const atts = await attachFiles(c.attach);
        setDraft((cur) => (cur && cur.id === d.id ? { ...cur, attachments: [...cur.attachments, ...atts] } : cur));
      }
    }
    if (typeof args.messageId === "string") {
      setFolder("inbox");
      setOpenId(args.messageId);
      setDraft(null);
    }
  });

  // Mark as read when opened.
  useEffect(() => {
    if (open && !open.read) void store.put<MailMessage>(COL_MAIL, { ...open, read: true });
  }, [open, store]);

  // Drafts save themselves a moment after you stop typing.
  const persistDraft = async (d: Draft) => {
    if (!user) return;
    const to = parseAddresses(d.to).ok;
    const cc = parseAddresses(d.cc).ok;
    await store.put<MailMessage>(COL_MAIL, { id: d.id, owner: user.id, folder: "drafts", from: { name: user.name, email: user.email }, to, cc, subject: d.subject, body: d.body, at: iso(now()), read: true, attachments: d.attachments, inReplyTo: d.inReplyTo, origin: "user" });
  };
  const updateDraft = (patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => {
    setDraft((d) => {
      if (!d) return d;
      const next = { ...d, ...(typeof patch === "function" ? patch(d) : patch) };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persistDraft(next).then(() => setStatus(`Draft saved at ${formatTime(now(), computer.timeZone)}`));
      }, 1200);
      return next;
    });
  };
  useEffect(() => () => void (saveTimer.current && clearTimeout(saveTimer.current)), []);

  const startReply = (m: MailMessage, kind: "reply" | "all" | "forward") => {
    if (!user) return;
    const others = [...m.to, ...m.cc].filter((a) => a.email.toLowerCase() !== user.email.toLowerCase());
    setDraft({
      id: newId("mail"),
      to: kind === "forward" ? "" : formatAddresses(m.folder === "sent" ? m.to : [m.from]),
      cc: kind === "all" ? formatAddresses(others.filter((a) => a.email !== m.from.email)) : "",
      subject: replySubject(m.subject, kind === "forward" ? "forward" : "reply"),
      body: kind === "forward" ? `\n\n---------- Forwarded message ----------\nFrom: ${formatAddresses([m.from])}\nDate: ${fmt(Date.parse(m.at))}\nSubject: ${m.subject}\nTo: ${formatAddresses(m.to)}\n\n${m.body}` : quoteBody(m, fmt),
      attachments: kind === "forward" ? m.attachments : [],
      inReplyTo: m.id,
    });
    setStatus(null);
  };

  const editDraft = (m: MailMessage) => {
    setDraft({ id: m.id, to: formatAddresses(m.to), cc: formatAddresses(m.cc), subject: m.subject, body: m.body, attachments: m.attachments, inReplyTo: m.inReplyTo });
    setStatus(null);
  };

  const send = async () => {
    if (!draft || !user) return;
    const to = parseAddresses(draft.to);
    const cc = parseAddresses(draft.cc);
    if (!to.ok.length && !cc.ok.length) return dialog.alert("Add at least one recipient in the To box.", { title: "Mail" });
    if (to.bad.length || cc.bad.length) return dialog.alert(`These don't look like email addresses:\n${[...to.bad, ...cc.bad].join("\n")}`, { title: "Mail" });
    if (!draft.subject.trim() && !(await dialog.confirm("Send this message without a subject?", { title: "Mail", okLabel: "Send" }))) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setBusy(true);
    try {
      const report = await sendMail(store, { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }, accounts, { to: to.ok, cc: cc.ok, subject: draft.subject.trim(), body: draft.body, attachments: draft.attachments, inReplyTo: draft.inReplyTo, draftId: draft.id }, now());
      setDraft(null);
      const parts = [];
      if (report.delivered.length) parts.push(`Delivered to ${report.delivered.map((a) => a.email).join(", ")}.`);
      if (report.automatic.length) parts.push(`Sent to sample contact${report.automatic.length > 1 ? "s" : ""} ${report.automatic.map((a) => a.email).join(", ")} (automatic reply).`);
      if (report.bounced.length) parts.push(`Couldn't deliver to ${report.bounced.map((a) => a.email).join(", ")}; see the delivery report in your Inbox.`);
      setStatus(parts.join(" "));
      setFolder("sent");
      setOpenId(report.sent.id);
    } finally {
      setBusy(false);
    }
  };

  const moveTo = async (m: MailMessage, target: string) => {
    await store.put<MailMessage>(COL_MAIL, { ...m, folder: target });
    if (openId === m.id) setOpenId(null);
  };

  const remove = async (m: MailMessage) => {
    if (m.folder === "trash") {
      if (!(await dialog.confirm("Permanently delete this message?", { title: "Mail", okLabel: "Delete" }))) return;
      for (const a of m.attachments) if (a.blobId) await store.deleteBlob(a.blobId);
      await store.delete(COL_MAIL, m.id);
      setOpenId(null);
    } else await moveTo(m, "trash");
  };

  const attachmentBlob = async (a: MailAttachment): Promise<Blob> => {
    if (a.blobId) {
      const b = await store.getBlob(a.blobId);
      if (b) return b;
      throw new Error(`${a.name} is missing.`);
    }
    const res = await fetch(a.url!);
    if (!res.ok) throw new Error(`Couldn't download ${a.name}.`);
    return res.blob();
  };

  const saveAttachment = async (a: MailAttachment, openAfter: boolean) => {
    if (!vfs || !fsFolders) return;
    try {
      const node = await vfs.writeFile(fsFolders.downloads, a.name, await attachmentBlob(a), { mime: a.mime, source: "ConnectMail attachment" });
      if (openAfter) {
        const t = appForFile(node);
        if (t) openApp(t.appId, t.args);
      } else notify({ title: "Attachment saved", body: `${node.name} is in your Downloads folder.`, icon: "download", action: { label: "Show in folder", run: () => openApp("explorer", { folderId: fsFolders.downloads, select: node.id }) } });
    } catch (e) {
      await dialog.alert(e instanceof Error ? e.message : String(e), { title: "Mail" });
    }
  };

  if (!user) return null;

  return (
    <div className="mail">
      <div className="toolbar">
        <button className="tool" onClick={() => (setDraft(emptyDraft()), setStatus(null))}>
          <Icon name="mail" size={16} /> New
        </button>
        {open && !draft && (
          <>
            {open.folder === "drafts" ? (
              <button className="tool" onClick={() => editDraft(open)}>
                Edit draft
              </button>
            ) : (
              <>
                <button className="tool" onClick={() => startReply(open, "reply")}>
                  Reply
                </button>
                <button className="tool" onClick={() => startReply(open, "all")}>
                  Reply all
                </button>
                <button className="tool" onClick={() => startReply(open, "forward")}>
                  Forward
                </button>
              </>
            )}
            <button className="tool" onClick={() => remove(open)}>
              Delete
            </button>
            {open.folder !== "archive" && open.folder !== "drafts" && (
              <button className="tool" onClick={() => moveTo(open, "archive")}>
                Archive
              </button>
            )}
            <select className="field" value="" onChange={(e) => e.target.value && void moveTo(open, e.target.value)} aria-label="Move to folder">
              <option value="">Move to...</option>
              {allFolders
                .filter((f) => f.id !== open.folder && f.id !== "drafts")
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
            </select>
            <button className="tool" onClick={() => store.put<MailMessage>(COL_MAIL, { ...open, read: false }).then(() => setOpenId(null))}>
              Mark unread
            </button>
          </>
        )}
        <span style={{ flex: 1 }} />
        <input className="field ml-search" type="search" placeholder="Search email" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search email" />
      </div>
      <div className="ml-main">
        <nav className="ml-folders" aria-label="Folders">
          <div className="ml-account">{user.email}</div>
          {allFolders.map((f) => (
            <button key={f.id} className={folder === f.id && !query ? "on" : ""} onClick={() => (setFolder(f.id), setQuery(""), setOpenId(null))} data-folder={f.id}>
              <span>{f.label}</span>
              {f.id !== "sent" && f.id !== "trash" && (f.id === "drafts" ? mail.filter((m) => m.folder === "drafts").length : unread(f.id)) > 0 && <b>{f.id === "drafts" ? mail.filter((m) => m.folder === "drafts").length : unread(f.id)}</b>}
            </button>
          ))}
          <button
            className="ml-newfolder"
            onClick={async () => {
              const name = await dialog.prompt("Name the new folder:", "", { title: "New folder" });
              if (name?.trim()) await store.put<MailFolder>(COL_MAIL_FOLDERS, { id: newId("fld"), owner: user.id, name: name.trim().slice(0, 40) });
            }}
          >
            + New folder
          </button>
          {custom.some((f) => f.id === folder) && (
            <button
              className="ml-newfolder"
              onClick={async () => {
                if (!(await dialog.confirm(`Delete the folder "${folderLabel}"? Messages in it move to Deleted.`, { title: "Delete folder", okLabel: "Delete" }))) return;
                for (const m of mail.filter((x) => x.folder === folder)) await store.put<MailMessage>(COL_MAIL, { ...m, folder: "trash" });
                await store.delete(COL_MAIL_FOLDERS, folder);
                setFolder("inbox");
              }}
            >
              Delete this folder
            </button>
          )}
          {folder === "trash" && mail.some((m) => m.folder === "trash") && (
            <button
              className="ml-newfolder"
              onClick={async () => {
                if (!(await dialog.confirm("Permanently delete everything in Deleted?", { title: "Empty Deleted", okLabel: "Delete" }))) return;
                for (const m of mail.filter((x) => x.folder === "trash")) {
                  for (const a of m.attachments) if (a.blobId) await store.deleteBlob(a.blobId);
                  await store.delete(COL_MAIL, m.id);
                }
              }}
            >
              Empty Deleted
            </button>
          )}
        </nav>
        <div className="ml-list" role="list" aria-label={query ? "Search results" : folderLabel}>
          {query && <div className="ml-list-note">Results for &quot;{query}&quot; in all folders</div>}
          {list.map((m) => (
            <button
              key={m.id}
              role="listitem"
              className={`ml-item${m.id === openId && !draft ? " on" : ""}${m.read ? "" : " unread"}`}
              onClick={() => {
                setDraft(null);
                setOpenId(m.id);
              }}
              onDoubleClick={() => m.folder === "drafts" && editDraft(m)}
            >
              <span className="ml-item-from">{m.folder === "sent" || m.folder === "drafts" ? `To: ${m.to.map((a) => a.name ?? a.email).join(", ") || "(no recipients)"}` : m.from.name ?? m.from.email}</span>
              <span className="ml-item-date">{formatShortDate(Date.parse(m.at), computer.timeZone)}</span>
              <span className="ml-item-subject">
                {m.attachments.length > 0 && "📎 "}
                {m.subject || "(no subject)"}
              </span>
              <span className="ml-item-preview">{m.body.replace(/\s+/g, " ").slice(0, 90)}</span>
            </button>
          ))}
          {list.length === 0 && <div className="empty">{query ? "No messages match your search." : folder === "inbox" ? "Your inbox is empty. New mail will show up here." : "There's nothing in this folder."}</div>}
        </div>
        <div className="ml-pane">
          {status && !draft && (
            <div className="ml-status" role="status">
              {status}
            </div>
          )}
          {draft ? (
            <form
              className="ml-compose"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <label>
                To
                <input className="field" value={draft.to} onChange={(e) => updateDraft({ to: e.target.value })} placeholder="name@connectmail.net, ..." aria-label="To" autoFocus={!draft.to} list="ml-addressbook" />
              </label>
              <datalist id="ml-addressbook">
                {users
                  .filter((u) => u.id !== user.id)
                  .map((u) => (
                    <option key={u.id} value={`${u.name} <${u.email}>`} />
                  ))}
              </datalist>
              <label>
                Cc
                <input className="field" value={draft.cc} onChange={(e) => updateDraft({ cc: e.target.value })} aria-label="Cc" />
              </label>
              <label>
                Subject
                <input className="field" value={draft.subject} onChange={(e) => updateDraft({ subject: e.target.value })} aria-label="Subject" />
              </label>
              <div className="ml-attachments">
                {draft.attachments.map((a) => (
                  <span key={a.id} className="ml-chip">
                    📎 {a.name} ({formatSize(a.size)})
                    <button type="button" aria-label={`Remove ${a.name}`} onClick={() => updateDraft({ attachments: draft.attachments.filter((x) => x.id !== a.id) })}>
                      ×
                    </button>
                  </span>
                ))}
                <button type="button" className="tool" onClick={() => setPicking(true)}>
                  📎 Attach files
                </button>
              </div>
              <textarea className="field" value={draft.body} onChange={(e) => updateDraft({ body: e.target.value })} aria-label="Message body" autoFocus={Boolean(draft.to)} />
              <div className="ml-compose-actions">
                <button className="btn primary" disabled={busy}>
                  {busy ? "Sending..." : "Send"}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={async () => {
                    if (saveTimer.current) clearTimeout(saveTimer.current);
                    await persistDraft(draft);
                    setStatus("Saved to Drafts.");
                    setDraft(null);
                    setFolder("drafts");
                  }}
                >
                  Save draft
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={async () => {
                    if (saveTimer.current) clearTimeout(saveTimer.current);
                    if (mail.some((m) => m.id === draft.id && m.folder === "drafts")) await store.delete(COL_MAIL, draft.id);
                    setDraft(null);
                    setStatus(null);
                  }}
                >
                  Discard
                </button>
                <span className="muted">{status}</span>
              </div>
            </form>
          ) : open ? (
            <article className="ml-read">
              <h1>{open.subject || "(no subject)"}</h1>
              <div className="ml-head">
                <strong>{open.from.name ?? open.from.email}</strong> <span className="muted">&lt;{open.from.email}&gt;</span>
                <div className="muted">To: {formatAddresses(open.to) || "(no recipients)"}</div>
                {open.cc.length > 0 && <div className="muted">Cc: {formatAddresses(open.cc)}</div>}
                <div className="muted">{fmt(Date.parse(open.at))}</div>
                {open.origin === "system" && <div className="ml-tag">Sent automatically by ConnectMail</div>}
              </div>
              {open.attachments.length > 0 && (
                <div className="ml-attachments">
                  {open.attachments.map((a) => (
                    <span key={a.id} className="ml-chip">
                      <Icon name={iconForFile({ kind: "file", mime: a.mime, name: a.name })} size={16} /> {a.name} ({formatSize(a.size)})
                      <button type="button" className="link-btn" onClick={() => saveAttachment(a, true)}>
                        Open
                      </button>
                      <button type="button" className="link-btn" onClick={() => saveAttachment(a, false)}>
                        Save to Downloads
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <MailBody text={open.body} />
            </article>
          ) : (
            <div className="empty">{list.length ? "Pick a message to read it." : ""}</div>
          )}
        </div>
      </div>
      {picking && (
        <FileDialog
          mode="open"
          title="Attach files"
          multiple
          startIn="documents"
          onClose={async (r) => {
            setPicking(false);
            if (!r?.files.length) return;
            const atts = await attachFiles(r.files.map((f) => f.id));
            updateDraft((d) => ({ attachments: [...d.attachments, ...atts] }));
          }}
        />
      )}
    </div>
  );
}
