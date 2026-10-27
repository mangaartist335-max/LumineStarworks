"use client";

// Brings in mail as it becomes due on the computer's clock and lets you
// know when something new lands in your inbox.

import { useEffect, useEffectEvent, useRef } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { COL_MAIL, deliverArchiveMail, type MailMessage } from "@/lib/mail";

export function MailService() {
  const { store, user, now, notify, openApp, wm } = useSystem();
  const [mail, , loaded] = useCollection<MailMessage>(COL_MAIL);
  const seen = useRef<Set<string> | null>(null);
  const isMailFocused = useEffectEvent(() => {
    const w = wm.windows.find((x) => x.appId === "mail");
    return Boolean(w && wm.focused === w.id);
  });

  useEffect(() => {
    if (!user) return;
    const run = () => void deliverArchiveMail(store, { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }, now());
    run();
    const t = setInterval(run, 30_000);
    return () => clearInterval(t);
  }, [store, user, now]);

  useEffect(() => {
    if (!loaded) return;
    if (seen.current === null) {
      seen.current = new Set(mail.map((m) => m.id));
      return;
    }
    const fresh = mail.filter((m) => !seen.current!.has(m.id));
    for (const m of fresh) seen.current.add(m.id);
    const incoming = fresh.filter((m) => m.folder === "inbox" && !m.read);
    if (!incoming.length) return;
    if (isMailFocused()) return;
    const first = incoming[0];
    notify({
      title: incoming.length > 1 ? `${incoming.length} new emails` : `New email from ${first.from.name ?? first.from.email}`,
      body: first.subject,
      icon: "mail",
      action: { label: "Read", run: () => openApp("mail", { messageId: first.id }) },
    });
  }, [mail, loaded, notify, openApp]);

  return null;
}
