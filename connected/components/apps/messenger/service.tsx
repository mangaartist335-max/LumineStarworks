"use client";

// Runs in the background whenever someone is logged on, even with the
// Messenger window closed: keeps your presence up to date for the other
// accounts on this computer, lets sample contacts answer (clearly marked as
// automatic replies), and pops up a notification when a message arrives.

import { useEffect, useRef } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { DEFAULT_CONTACTS, sampleContactById } from "@/data/messenger";
import { COL_CONTACTS, COL_MESSAGES, presenceAt, scriptedReply, type Conversation, type ImMessage, COL_CONVERSATIONS } from "@/lib/messenger";
import { iso } from "@/lib/time";
import { heartbeatKey, typingKey, useContactResolver } from "./shared";

const HEARTBEAT_MS = 30_000;

export function MessengerService() {
  const { store, user, settings, now, computer, notify, openApp, wm } = useSystem();
  const [messages, , messagesLoaded] = useCollection<ImMessage>(COL_MESSAGES, { allUsers: true });
  const [conversations] = useCollection<Conversation>(COL_CONVERSATIONS, { allUsers: true });
  const resolve = useContactResolver();
  const scheduled = useRef(new Set<string>());
  const seen = useRef<Set<string> | null>(null);
  const wmRef = useRef(wm);
  wmRef.current = wm;

  // Presence heartbeat.
  useEffect(() => {
    if (!user) return;
    const beat = () => store.kvSet(heartbeatKey(user.id), { status: settings.messenger.status, message: settings.messenger.message, at: Date.now() });
    void beat();
    const t = setInterval(beat, HEARTBEAT_MS);
    return () => {
      clearInterval(t);
      void store.kvSet(heartbeatKey(user.id), { status: "offline", message: settings.messenger.message, at: 0 });
    };
  }, [store, user, settings.messenger.status, settings.messenger.message]);

  // New accounts start with the sample friends on their list.
  useEffect(() => {
    if (!user) return;
    const key = `im-contacts-init:${user.id}`;
    void store.kvGet<boolean>(key).then(async (done) => {
      if (done) return;
      for (const id of DEFAULT_CONTACTS) await store.put(COL_CONTACTS, { id: `${user.id}:${id}`, owner: user.id, contactId: id, addedAt: iso(now()) });
      await store.kvSet(key, true);
    });
  }, [store, user, now]);

  // Automatic replies from sample contacts.
  useEffect(() => {
    if (!user) return;
    const check = () => {
      const t = now();
      for (const conv of conversations) {
        if (!conv.members.includes(user.id)) continue;
        const samples = conv.members.filter((m) => m.startsWith("ct_"));
        if (!samples.length) continue;
        const thread = messages.filter((m) => m.conversationId === conv.id).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
        const lastIndex = thread.map((m) => m.from === user.id && m.kind === "text").lastIndexOf(true);
        const last = thread[lastIndex];
        if (!last || scheduled.current.has(last.id)) continue;
        // Already answered by someone with a real reply.
        if (thread.slice(lastIndex + 1).some((m) => m.from !== user.id && m.kind === "text")) continue;
        // In a group, whoever has said the least answers.
        const candidates = samples
          .map((id) => ({ id, contact: sampleContactById(id)!, said: thread.filter((m) => m.from === id).length }))
          .filter((c) => c.contact)
          .sort((a, b) => a.said - b.said);
        const online = candidates.find((c) => presenceAt(c.contact, t, computer.timeZone) === "online");
        const away = conv.group ? undefined : candidates.find((c) => ["away", "busy"].includes(presenceAt(c.contact, t, computer.timeZone)));
        if (online) {
          scheduled.current.add(last.id);
          const replies = thread.filter((m) => m.from === online.id && m.origin === "scripted").length;
          const text = scriptedReply(online.contact, last.text, replies);
          const typeDelay = 900 + (last.id.charCodeAt(last.id.length - 1) % 5) * 250;
          setTimeout(() => void store.kvSet(typingKey(conv.id), { who: online.id, at: Date.now() }), 700);
          setTimeout(async () => {
            await store.put<ImMessage>(COL_MESSAGES, { id: `${last.id}_re`, conversationId: conv.id, from: online.id, text, at: iso(now()), kind: "text", origin: "scripted", replyTo: last.id });
            await store.kvSet(typingKey(conv.id), null);
          }, 700 + typeDelay + Math.min(2500, text.length * 40));
        } else if (away) {
          // One away message per stretch of unanswered messages.
          const lastFromThem = [...thread].reverse().find((m) => m.from === away.id);
          if (lastFromThem?.kind === "away") continue;
          setTimeout(() => void store.put<ImMessage>(COL_MESSAGES, { id: `${last.id}_away`, conversationId: conv.id, from: away.id, text: away.contact.awayMessage, at: iso(now()), kind: "away", origin: "scripted", replyTo: last.id }), 800);
        }
      }
    };
    check();
    // Friends who were away answer once they come back online.
    const t = setInterval(check, 15_000);
    return () => clearInterval(t);
  }, [user, messages, conversations, store, now, computer.timeZone]);

  // Pop-up notifications for incoming messages.
  useEffect(() => {
    if (!user || !messagesLoaded) return;
    if (seen.current === null) {
      seen.current = new Set(messages.map((m) => m.id));
      return;
    }
    for (const m of messages) {
      if (seen.current.has(m.id)) continue;
      seen.current.add(m.id);
      if (m.from === user.id || m.kind === "system") continue;
      const conv = conversations.find((c) => c.id === m.conversationId);
      if (!conv?.members.includes(user.id)) continue;
      const messengerWin = wmRef.current.windows.find((w) => w.appId === "messenger");
      if (messengerWin && wmRef.current.focused === messengerWin.id) continue;
      const who = resolve(m.from);
      notify({
        title: m.kind === "nudge" ? `${who.name} sent you a nudge!` : `${who.name} says:`,
        body: m.kind === "nudge" ? undefined : m.text.slice(0, 120),
        icon: "messenger",
        action: { label: "Reply", run: () => openApp("messenger", { conversationId: conv.id }) },
      });
    }
  }, [messages, messagesLoaded, conversations, user, notify, openApp, resolve]);

  return null;
}
