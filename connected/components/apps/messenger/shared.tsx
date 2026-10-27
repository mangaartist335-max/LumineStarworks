"use client";

// Messenger state shared by the app window and the background service.

import { useCallback, useEffect, useState } from "react";
import { useSystem, useClock } from "@/components/system/system";
import { avatarUrl } from "@/components/system/defaults";
import type { Presence } from "@/components/system/types";
import { sampleContactById } from "@/data/messenger";
import { accountPresence, presenceAt, statusMessageAt, type Heartbeat } from "@/lib/messenger";

export interface ContactInfo {
  id: string;
  name: string;
  email: string;
  avatar: string;
  presence: Presence;
  message: string;
  sample: boolean;
}

export const heartbeatKey = (userId: string) => `im-presence:${userId}`;
export const typingKey = (conversationId: string) => `im-typing:${conversationId}`;

export interface TypingState {
  who: string;
  at: number;
}

/** Real (not simulated) time, refreshed every `interval` ms: presence and typing expire in real time. */
function useRealClock(interval: number): number {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return t;
}

/** Live heartbeats of every account on this computer. */
export function useHeartbeats(): Record<string, Heartbeat | undefined> {
  const { store, users } = useSystem();
  const [beats, setBeats] = useState<Record<string, Heartbeat | undefined>>({});
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const entries = await Promise.all(users.map(async (u) => [u.id, await store.kvGet<Heartbeat>(heartbeatKey(u.id))] as const));
      if (alive) setBeats(Object.fromEntries(entries));
    };
    void load();
    const off = store.subscribe((e) => e.kind === "kv" && e.key.startsWith("im-presence:") && void load());
    const t = setInterval(load, 20_000);
    return () => {
      alive = false;
      off();
      clearInterval(t);
    };
  }, [store, users]);
  return beats;
}

/** Name, picture and presence for any chat member: an account here or a sample contact. */
export function useContactResolver(): (id: string) => ContactInfo {
  const { users, user, settings, computer } = useSystem();
  const beats = useHeartbeats();
  const t = useClock(15_000);
  const real = useRealClock(15_000);
  return useCallback(
    (id: string): ContactInfo => {
      const c = sampleContactById(id);
      if (c) return { id, name: c.name, email: c.email, avatar: avatarUrl(c.avatar), presence: presenceAt(c, t, computer.timeZone), message: statusMessageAt(c, t), sample: true };
      if (id === user?.id) return { id, name: user.name, email: user.email, avatar: avatarUrl(user.picture), presence: settings.messenger.status, message: settings.messenger.message, sample: false };
      const u = users.find((x) => x.id === id);
      const hb = beats[id];
      return { id, name: u?.name ?? "Someone", email: u?.email ?? "", avatar: avatarUrl(u?.picture ?? "sun"), presence: accountPresence(hb, real), message: hb?.message ?? "", sample: false };
    },
    [users, user, settings.messenger, beats, t, real, computer.timeZone],
  );
}

/** Who (other than me) is typing in a conversation right now. */
export function useTyping(conversationId: string | null): string | null {
  const { store, user } = useSystem();
  const [state, setState] = useState<TypingState | null>(null);
  const real = useRealClock(1000);
  useEffect(() => {
    if (!conversationId) return;
    let alive = true;
    const load = () => store.kvGet<TypingState>(typingKey(conversationId)).then((v) => alive && setState(v ?? null));
    void load();
    const off = store.subscribe((e) => e.kind === "kv" && e.key === typingKey(conversationId) && void load());
    return () => {
      alive = false;
      off();
    };
  }, [store, conversationId]);
  if (!state || state.who === user?.id || real - state.at > 5000) return null;
  return state.who;
}
