"use client";

// Connected Messenger: your contact list, status, and chats (one-to-one or
// in groups) with typing indicators, emoticons, nudges and links that open
// in the browser.

import { useEffect, useMemo, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection, useUserValue } from "@/components/system/hooks";
import type { Presence } from "@/components/system/types";
import { DEFAULT_CONTACTS, sampleContactByEmail } from "@/data/messenger";
import { COL_CONTACTS, COL_CONVERSATIONS, COL_MESSAGES, directId, EMOTICONS, tokenize, type Conversation, type ImMessage } from "@/lib/messenger";
import { newId } from "@/lib/ids";
import { formatDate, formatTime, iso } from "@/lib/time";
import { useArgs, useIsFocused, useWindowTitle } from "../common";
import type { AppProps } from "../registry";
import { typingKey, useContactResolver, useTyping, type ContactInfo } from "./shared";

interface ContactDoc {
  id: string;
  owner: string;
  contactId: string;
  addedAt: string;
}

const PRESENCE_LABEL: Record<Presence, string> = { online: "Online", away: "Away", busy: "Busy", offline: "Offline" };
const PICKER = [...new Map(EMOTICONS.map(([code, emoji]) => [emoji, code])).entries()];

function Avatar({ c, size = 36 }: { c: ContactInfo; size?: number }) {
  return (
    <span className={`im-avatar presence-ring-${c.presence}`} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.avatar} alt="" />
    </span>
  );
}

function ChatText({ text }: { text: string }) {
  const { openApp } = useSystem();
  return (
    <>
      {tokenize(text).map((t, i) =>
        t.kind === "text" ? (
          <span key={i}>{t.text}</span>
        ) : t.kind === "emoticon" ? (
          <span key={i} className="im-emoticon" title={t.code}>
            {t.emoji}
          </span>
        ) : (
          <a
            key={i}
            href={t.url}
            onClick={(e) => {
              e.preventDefault();
              openApp("browser", { url: t.url });
            }}
          >
            {t.text}
          </a>
        ),
      )}
    </>
  );
}

export default function Messenger({ win }: AppProps) {
  const { user, users, store, now, settings, updateSettings } = useSystem();
  const resolve = useContactResolver();
  const [contactDocs] = useCollection<ContactDoc>(COL_CONTACTS);
  const [conversations] = useCollection<Conversation>(COL_CONVERSATIONS, { allUsers: true });
  const [messages] = useCollection<ImMessage>(COL_MESSAGES, { allUsers: true });
  const [lastRead, setLastRead] = useUserValue<Record<string, string>>("im-read", {});
  const [open, setOpen] = useState<string | null>(null);
  const [share, setShare] = useState<{ url: string; title: string } | null>(null);
  const [draftFor, setDraftFor] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");
  const [adding, setAdding] = useState(false);
  const [grouping, setGrouping] = useState(false);
  const [wide, setWide] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const focused = useIsFocused(win);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWide(el.clientWidth >= 620));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const mine = useMemo(() => conversations.filter((c) => user && c.members.includes(user.id)), [conversations, user]);
  const contactIds = useMemo(() => {
    const ids = [...users.filter((u) => u.id !== user?.id).map((u) => u.id), ...contactDocs.map((d) => d.contactId)];
    return [...new Set(ids)];
  }, [users, user, contactDocs]);
  const contacts = contactIds.map(resolve);
  const shown = contacts.filter((c) => !filter || `${c.name} ${c.email}`.toLowerCase().includes(filter.toLowerCase()));
  const order: Presence[] = ["online", "busy", "away", "offline"];
  shown.sort((a, b) => order.indexOf(a.presence) - order.indexOf(b.presence) || a.name.localeCompare(b.name));

  const unread = (convId: string) => messages.filter((m) => m.conversationId === convId && m.from !== user?.id && m.at > (lastRead[convId] ?? "")).length;

  const openWith = async (contactId: string) => {
    if (!user) return;
    const id = directId(user.id, contactId);
    if (!conversations.some((c) => c.id === id)) await store.put<Conversation>(COL_CONVERSATIONS, { id, members: [user.id, contactId].sort(), group: false, createdBy: user.id, createdAt: iso(now()), origin: "user" });
    setOpen(id);
    return id;
  };

  useArgs(win, (args) => {
    if (typeof args.share === "string") setShare({ url: args.share, title: typeof args.shareTitle === "string" ? args.shareTitle : "" });
    if (typeof args.conversationId === "string") setOpen(args.conversationId);
  });

  // Mark the open chat as read while the window has focus.
  useEffect(() => {
    if (!open || !focused) return;
    const latest = messages.filter((m) => m.conversationId === open).reduce((max, m) => (m.at > max ? m.at : max), "");
    if (latest && latest > (lastRead[open] ?? "")) void setLastRead({ ...lastRead, [open]: latest });
  }, [open, focused, messages, lastRead, setLastRead]);

  const openConv = mine.find((c) => c.id === open);
  const title = openConv ? (openConv.group ? openConv.title ?? "Group chat" : resolve(openConv.members.find((m) => m !== user?.id) ?? "").name) : "";
  useWindowTitle(win, openConv && !wide ? `${title} - Messenger` : "Messenger");

  const shareTo = async (convId: string | undefined) => {
    if (!convId || !share) return;
    setDraftFor((d) => ({ ...d, [convId]: `${share.title ? `${share.title} ` : ""}${share.url}` }));
    setShare(null);
    setOpen(convId);
  };

  if (!user) return null;
  const me = resolve(user.id);

  const list = (
    <div className="im-list">
      <div className="im-me">
        <Avatar c={me} size={48} />
        <div className="im-me-info">
          <strong>{user.name}</strong>
          <select className="im-status" value={settings.messenger.status} onChange={(e) => updateSettings({ messenger: { ...settings.messenger, status: e.target.value as Presence } })} aria-label="Your status">
            <option value="online">Online</option>
            <option value="away">Away</option>
            <option value="busy">Busy</option>
            <option value="offline">Appear offline</option>
          </select>
          <PersonalMessage value={settings.messenger.message} onSave={(message) => updateSettings({ messenger: { ...settings.messenger, message } })} />
        </div>
      </div>
      {share && (
        <div className="im-share">
          <strong>Share a link</strong>
          <div className="im-share-link">{share.title || share.url}</div>
          <div className="muted">Pick who to send it to:</div>
        </div>
      )}
      <div className="im-search">
        <input className="field" placeholder="Find a contact..." value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Find a contact" />
        <button className="tool" onClick={() => setAdding((v) => !v)} title="Add a contact" aria-label="Add a contact">
          +👤
        </button>
        <button className="tool" onClick={() => setGrouping((v) => !v)} title="New group chat" aria-label="New group chat">
          +👥
        </button>
      </div>
      {adding && <AddContact existing={contactIds} onDone={() => setAdding(false)} />}
      {grouping && (
        <NewGroup
          contacts={contacts}
          onDone={(id) => {
            setGrouping(false);
            if (id) setOpen(id);
          }}
        />
      )}
      <div className="im-groups scroll">
        {mine.some((c) => c.group) && <div className="im-group-head">Group chats</div>}
        {mine
          .filter((c) => c.group)
          .map((c) => (
            <button key={c.id} className={`im-contact${open === c.id ? " on" : ""}`} onClick={() => (share ? shareTo(c.id) : setOpen(c.id))}>
              <span className="im-avatar group">👥</span>
              <span className="im-contact-text">
                <strong>{c.title ?? "Group chat"}</strong>
                <small>{c.members.filter((m) => m !== user.id).map((m) => resolve(m).name).join(", ")}</small>
              </span>
              {unread(c.id) > 0 && <span className="im-badge">{unread(c.id)}</span>}
            </button>
          ))}
        {order.map((p) => {
          const group = shown.filter((c) => c.presence === p);
          if (!group.length) return null;
          return (
            <div key={p}>
              <div className="im-group-head">
                {PRESENCE_LABEL[p]} ({group.length})
              </div>
              {group.map((c) => {
                const convId = directId(user.id, c.id);
                return (
                  <button key={c.id} className={`im-contact${open === convId ? " on" : ""}`} onClick={async () => (share ? shareTo(await openWith(c.id)) : void openWith(c.id))} data-contact={c.name}>
                    <Avatar c={c} />
                    <span className="im-contact-text">
                      <strong>
                        {c.name}
                        {c.sample && <span className="im-sample" title="Sample contact: their replies are automatic"> ★</span>}
                      </strong>
                      <small>{c.message || PRESENCE_LABEL[c.presence]}</small>
                    </span>
                    {unread(convId) > 0 && <span className="im-badge">{unread(convId)}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
        {shown.length === 0 && <div className="empty">No contacts match.</div>}
      </div>
      <div className="im-foot muted">★ Sample contacts come with your account. Their replies are automatic.</div>
    </div>
  );

  const chat = openConv ? (
    <Chat
      key={openConv.id}
      conv={openConv}
      onBack={() => setOpen(null)}
      showBack={!wide}
      draft={draftFor[openConv.id] ?? ""}
      clearDraft={() => setDraftFor((d) => ({ ...d, [openConv.id]: "" }))}
      onRemoveContact={async (id) => {
        await store.delete(COL_CONTACTS, `${user.id}:${id}`);
        setOpen(null);
      }}
      isContact={(id) => contactDocs.some((d) => d.contactId === id)}
    />
  ) : null;

  return (
    <div className={`messenger${wide ? " wide" : ""}`} ref={root}>
      {wide ? (
        <>
          {list}
          {chat ?? <div className="im-chat empty">Pick someone to chat with.</div>}
        </>
      ) : (
        chat ?? list
      )}
    </div>
  );
}

function PersonalMessage({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      className="im-personal"
      placeholder="<Share a quick message>"
      value={draft ?? value}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== null && draft !== value) onSave(draft.slice(0, 80));
        setDraft(null);
      }}
      onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
      aria-label="Personal message"
      maxLength={80}
    />
  );
}

function AddContact({ existing, onDone }: { existing: string[]; onDone: () => void }) {
  const { store, user, users, now } = useSystem();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="im-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!user) return;
        const addr = email.trim().toLowerCase();
        if (users.some((u) => u.email.toLowerCase() === addr)) return setError("They have an account on this computer, so they're already on your list.");
        const c = sampleContactByEmail(addr);
        if (!c) return setError("No Connected Messenger account uses that address.");
        if (existing.includes(c.id)) return setError(`${c.name} is already on your list.`);
        await store.put(COL_CONTACTS, { id: `${user.id}:${c.id}`, owner: user.id, contactId: c.id, addedAt: iso(now()) });
        onDone();
      }}
    >
      <label>
        Their email address
        <input className="field" type="email" value={email} onChange={(e) => (setEmail(e.target.value), setError(null))} placeholder="name@mail.connectedera.local" autoFocus aria-label="Contact email" />
      </label>
      {error && <div className="error-text">{error}</div>}
      <div className="im-row">
        <button className="btn primary" disabled={!email.trim()}>
          Add contact
        </button>
        <button type="button" className="btn" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function NewGroup({ contacts, onDone }: { contacts: ContactInfo[]; onDone: (id: string | null) => void }) {
  const { store, user, now } = useSystem();
  const [picked, setPicked] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  return (
    <form
      className="im-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!user || picked.length < 2) return;
        const id = newId("conv");
        const at = iso(now());
        await store.put<Conversation>(COL_CONVERSATIONS, { id, members: [user.id, ...picked], group: true, title: title.trim() || undefined, createdBy: user.id, createdAt: at, origin: "user" });
        await store.put<ImMessage>(COL_MESSAGES, { id: newId("msg"), conversationId: id, from: user.id, text: `${user.name} started a group chat.`, at, kind: "system", origin: "user" });
        onDone(id);
      }}
    >
      <label>
        Group name
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekend plans" aria-label="Group name" maxLength={40} />
      </label>
      <div className="im-pick">
        {contacts.map((c) => (
          <label key={c.id}>
            <input type="checkbox" checked={picked.includes(c.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id)))} /> {c.name}
          </label>
        ))}
      </div>
      <div className="im-row">
        <button className="btn primary" disabled={picked.length < 2}>
          Start group chat
        </button>
        <button type="button" className="btn" onClick={() => onDone(null)}>
          Cancel
        </button>
      </div>
      <small className="muted">Pick at least two people.</small>
    </form>
  );
}

function Chat({ conv, onBack, showBack, draft, clearDraft, onRemoveContact, isContact }: { conv: Conversation; onBack: () => void; showBack: boolean; draft: string; clearDraft: () => void; onRemoveContact: (id: string) => void; isContact: (id: string) => boolean }) {
  const { store, user, now, computer, users } = useSystem();
  const resolve = useContactResolver();
  const [messages] = useCollection<ImMessage>(COL_MESSAGES, { allUsers: true });
  const [text, setText] = useState(draft);
  const [picker, setPicker] = useState(false);
  const [shake, setShake] = useState(false);
  const [adding, setAdding] = useState(false);
  const typingWho = useTyping(conv.id);
  const lastTyping = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const thread = useMemo(() => messages.filter((m) => m.conversationId === conv.id).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id)), [messages, conv.id]);
  const others = conv.members.filter((m) => m !== user?.id);
  const other = !conv.group ? resolve(others[0]) : null;

  // A link shared into this chat while it's open fills in the message box.
  const [shownDraft, setShownDraft] = useState(draft);
  if (draft !== shownDraft) {
    setShownDraft(draft);
    if (draft) setText(draft);
  }
  useEffect(() => {
    if (draft) input.current?.focus();
  }, [draft]);

  // Which messages start a new day or a new speaker.
  const rows = useMemo(
    () =>
      thread.map((m, i) => {
        const prev = thread[i - 1];
        const day = formatDate(Date.parse(m.at), computer.timeZone);
        const showDay = !prev || formatDate(Date.parse(prev.at), computer.timeZone) !== day;
        const showName = showDay || prev.kind !== "text" || prev.from !== m.from || m.kind !== "text";
        return { m, day, showDay, showName };
      }),
    [thread, computer.timeZone],
  );

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [thread.length, typingWho]);

  // Shake when someone nudges you.
  const lastNudge = useRef<string | null>(null);
  useEffect(() => {
    const n = [...thread].reverse().find((m) => m.kind === "nudge");
    if (!n) return;
    if (lastNudge.current !== null && n.id !== lastNudge.current) {
      setShake(true);
      setTimeout(() => setShake(false), 700);
    }
    lastNudge.current = n.id;
  }, [thread]);

  if (!user) return null;

  const send = async (kind: ImMessage["kind"] = "text") => {
    const body = kind === "nudge" ? `${user.name} sent a nudge!` : text.trim();
    if (!body) return;
    await store.put<ImMessage>(COL_MESSAGES, { id: newId("msg"), conversationId: conv.id, from: user.id, text: body.slice(0, 2000), at: iso(now()), kind, origin: "user" });
    await store.kvSet(typingKey(conv.id), null);
    if (kind === "text") {
      setText("");
      clearDraft();
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 700);
    }
  };

  const onType = (v: string) => {
    setText(v);
    if (Date.now() - lastTyping.current > 1500 && v) {
      lastTyping.current = Date.now();
      void store.kvSet(typingKey(conv.id), { who: user.id, at: Date.now() });
    }
  };

  return (
    <div className={`im-chat${shake ? " shake" : ""}`} data-conversation={conv.id}>
      <div className="im-chat-head">
        {showBack && (
          <button className="tool" onClick={onBack} aria-label="Back to contacts">
            ←
          </button>
        )}
        {other ? <Avatar c={other} size={40} /> : <span className="im-avatar group">👥</span>}
        <div className="im-chat-title">
          <strong>{other ? other.name : conv.title ?? "Group chat"}</strong>
          <small>{other ? `${PRESENCE_LABEL[other.presence]}${other.message ? ` · ${other.message}` : ""}` : others.map((m) => resolve(m).name).join(", ")}</small>
        </div>
        {conv.group && (
          <button className="tool" onClick={() => setAdding((v) => !v)} title="Add people">
            +👤
          </button>
        )}
        {other?.sample && isContact(other.id) && (
          <button className="tool" onClick={() => onRemoveContact(other.id)} title="Remove from contacts">
            Remove
          </button>
        )}
      </div>
      {adding && conv.group && (
        <div className="im-form">
          {[...users.filter((u) => u.id !== user.id).map((u) => u.id)]
            .concat(DEFAULT_CONTACTS)
            .filter((id) => !conv.members.includes(id))
            .map((id) => (
              <button
                key={id}
                className="link-btn"
                onClick={async () => {
                  await store.put<Conversation>(COL_CONVERSATIONS, { ...conv, members: [...conv.members, id] });
                  await store.put<ImMessage>(COL_MESSAGES, { id: newId("msg"), conversationId: conv.id, from: user.id, text: `${user.name} added ${resolve(id).name}.`, at: iso(now()), kind: "system", origin: "user" });
                  setAdding(false);
                }}
              >
                + {resolve(id).name}
              </button>
            ))}
        </div>
      )}
      {other?.sample && <div className="im-note">{other.name} is a sample contact. Their replies are automatic.</div>}
      {other && !other.sample && other.presence === "offline" && <div className="im-note">{other.name} is offline. They&apos;ll see your messages next time they sign in on this computer.</div>}
      <div className="im-messages" ref={scroller} aria-live="polite">
        {thread.length === 0 && <div className="empty">Say hello! 👋</div>}
        {rows.map(({ m, day, showDay, showName }) => {
          const who = resolve(m.from);
          return (
            <div key={m.id}>
              {showDay && <div className="im-day">{day}</div>}
              {m.kind === "system" ? (
                <div className="im-system">{m.text}</div>
              ) : m.kind === "nudge" ? (
                <div className="im-system">
                  ⚡ {m.from === user.id ? "You sent a nudge!" : `${who.name} sent you a nudge!`} <span className="muted">{formatTime(Date.parse(m.at), computer.timeZone)}</span>
                </div>
              ) : (
                <div className={`im-msg${m.from === user.id ? " mine" : ""}${m.kind === "away" ? " away" : ""}`}>
                  {showName && (
                    <div className="im-says">
                      {m.from === user.id ? "You say:" : `${who.name} ${m.kind === "away" ? "(automatic away message)" : "says:"}`}
                      <span className="muted">
                        {" "}
                        {formatTime(Date.parse(m.at), computer.timeZone)}
                        {m.origin === "scripted" && m.kind === "text" ? " · automatic reply" : ""}
                      </span>
                    </div>
                  )}
                  <div className="im-text">
                    <ChatText text={m.text} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="im-typing">{typingWho ? `${resolve(typingWho).name} is typing...` : ""}</div>
      <div className="im-compose">
        <div className="im-tools">
          <button className="tool" onClick={() => setPicker((v) => !v)} aria-label="Emoticons" title="Emoticons" aria-expanded={picker}>
            🙂
          </button>
          <button className="tool" onClick={() => send("nudge")} title="Send a nudge">
            ⚡ Nudge
          </button>
        </div>
        {picker && (
          <div className="im-picker" role="listbox" aria-label="Emoticons">
            {PICKER.map(([emoji, code]) => (
              <button
                key={code}
                title={code}
                onClick={() => {
                  setText((t) => `${t}${t && !t.endsWith(" ") ? " " : ""}${code} `);
                  setPicker(false);
                  input.current?.focus();
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <textarea
            ref={input}
            className="field"
            value={text}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={3}
            aria-label="Message"
            placeholder="Type a message"
          />
          <button className="btn primary" disabled={!text.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
