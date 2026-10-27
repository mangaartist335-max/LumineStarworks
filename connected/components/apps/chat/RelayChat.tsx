"use client";

// Relay Chat: an IRC-style client for irc.connectedera.local. Channels keep
// the regulars' scrollback, and everyone with an account on this computer
// can chat live: nicknames, topics, private messages, away messages and
// channel operators who can set topics and kick. Logs save as plain text.

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection, useUserValue } from "@/components/system/hooks";
import { archiveChannel, archiveChannels, NETWORK, RESERVED_NICKS, SERVICE_NICK } from "@/data/irc";
import { describe, exportLog, HELP, parseLine, type LogLine } from "@/lib/irc";
import { newId } from "@/lib/ids";
import { formatDate, formatTime, iso } from "@/lib/time";
import { userHandle } from "@/components/sites/metube/store";
import { useWindowTitle } from "../common";
import type { AppProps } from "../registry";

interface StoredLine extends LogLine {
  id: string;
  owner: string;
  target: string;
  origin: "user";
}
interface NickRecord {
  id: string;
  owner: string;
  nick: string;
  away: string | null;
}
interface Member {
  id: string;
  owner: string;
  channel: string;
  joinedAt: string;
}
interface ChannelRecord {
  id: string;
  owner: string;
  topic: string;
  topicBy: string;
  topicAt: string;
  ops: string[];
  kicked: string[];
}
interface Profile {
  windows: string[];
  current: string;
}

const pmKey = (a: string, b: string) => `pm:${[a, b].sort().join(":")}`;
const isChannel = (w: string) => w.startsWith("#");

export default function RelayChat({ win }: AppProps) {
  const { store, user, now, computer, vfs, folders, notify } = useSystem();
  const [lines] = useCollection<StoredLine>("irc.lines", { allUsers: true });
  const [nicks, , nicksLoaded] = useCollection<NickRecord>("irc.nicks", { allUsers: true });
  const [members] = useCollection<Member>("irc.members", { allUsers: true });
  const [channelRecords] = useCollection<ChannelRecord>("irc.channels", { allUsers: true });
  const [profile, setProfile, profileLoaded] = useUserValue<Profile>("irc-profile", { windows: ["#general"], current: "#general" });
  const [input, setInput] = useState("");
  const [notices, setNotices] = useState<Record<string, LogLine[]>>({});
  const [cleared, setCleared] = useState<Record<string, string>>({});
  const scroller = useRef<HTMLDivElement>(null);
  const t = now();
  const zone = computer.timeZone;

  const me = nicks.find((n) => n.owner === user?.id);
  const nickOf = (owner: string) => nicks.find((n) => n.owner === owner)?.nick ?? "someone";
  const window_ = profile.windows.includes(profile.current) ? profile.current : profile.windows[0] ?? "#general";
  const channelInfo = (name: string) => {
    const rec = channelRecords.find((c) => c.id === name);
    const arch = archiveChannel(name);
    return { topic: rec?.topic ?? arch?.topic ?? "", topicBy: rec?.topicBy ?? arch?.topicBy ?? "", ops: rec?.ops ?? [], kicked: rec?.kicked ?? [], archive: Boolean(arch), exists: Boolean(rec || arch) };
  };
  const inChannel = (name: string, owner = user?.id) => members.some((m) => m.channel === name && m.owner === owner);
  const pmPartner = (w: string) => (w.startsWith("pm:") ? w.split(":").slice(1).find((x) => x !== user?.id) : undefined);
  const titleOf = (w: string) => (isChannel(w) ? w : nickOf(pmPartner(w) ?? ""));
  useWindowTitle(win, me ? `${titleOf(window_)} - Relay Chat (${me.nick})` : "Relay Chat");

  // First visit: pick a nickname from the account name and join #general.
  const signOn = useEffectEvent(async () => {
    if (!user || me) return;
    const base = userHandle(user.name).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 12) || "guest";
    let nick = /^[0-9-]/.test(base) ? `u${base}` : base;
    for (let i = 2; RESERVED_NICKS.has(nick.toLowerCase()) || nicks.some((n) => n.nick.toLowerCase() === nick.toLowerCase()); i++) nick = `${base.slice(0, 12)}${i}`;
    await store.put<NickRecord>("irc.nicks", { id: user.id, owner: user.id, nick, away: null });
    await store.put<Member>("irc.members", { id: `${user.id}:#general`, owner: user.id, channel: "#general", joinedAt: iso(now()) });
    await store.put<StoredLine>("irc.lines", { id: newId("msg"), owner: user.id, target: "#general", nick, kind: "join", text: "", at: iso(now()), origin: "user" });
  });
  useEffect(() => {
    if (nicksLoaded && profileLoaded) void signOn();
  }, [nicksLoaded, profileLoaded]);

  const shown: LogLine[] = useMemo(() => {
    const from = cleared[window_];
    const arch = isChannel(window_) ? (archiveChannel(window_)?.log ?? []) : [];
    const live = lines.filter((l) => l.target === window_);
    return [...arch, ...live, ...(notices[window_] ?? [])].filter((l) => Date.parse(l.at) <= t + 1000 && (!from || l.at > from)).sort((a, b) => a.at.localeCompare(b.at));
  }, [lines, notices, cleared, window_, t]);

  const lastCount = useRef(0);
  useEffect(() => {
    if (shown.length !== lastCount.current) scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
    lastCount.current = shown.length;
  }, [shown.length]);

  const notice = (text: string, w = window_) => setNotices((n) => ({ ...n, [w]: [...(n[w] ?? []), { at: iso(now()), nick: SERVICE_NICK, kind: "notice", text }] }));
  const post = (target: string, kind: LogLine["kind"], text: string, nick = me?.nick ?? "") =>
    user ? store.put<StoredLine>("irc.lines", { id: newId("msg"), owner: user.id, target, nick, kind, text: text.slice(0, 500), at: iso(now()), origin: "user" }) : Promise.resolve();
  const open = (w: string) => setProfile({ windows: profile.windows.includes(w) ? profile.windows : [...profile.windows, w], current: w });

  const run = async (line: string) => {
    if (!user || !me) return;
    const cmd = parseLine(line);
    if (!cmd) return;
    const here = window_;
    const info = channelInfo(here);
    switch (cmd.kind) {
      case "say":
      case "me": {
        const kind = cmd.kind === "say" ? "msg" : "action";
        if (isChannel(here)) {
          if (!inChannel(here)) return notice(info.kicked.includes(user.id) ? `You were removed from ${here} by a channel operator.` : `You're not in ${here}. Type /join ${here} to come back.`);
          return post(here, kind, cmd.text);
        }
        const partner = pmPartner(here);
        await post(here, kind, cmd.text);
        const away = nicks.find((n) => n.owner === partner)?.away;
        if (away) notice(`${nickOf(partner!)} is away: ${away}`);
        return;
      }
      case "join": {
        const ch = channelInfo(cmd.channel);
        if (ch.kicked.includes(user.id)) return notice(`You were removed from ${cmd.channel} by a channel operator, so you can't rejoin it.`);
        if (!ch.exists) await store.put<ChannelRecord>("irc.channels", { id: cmd.channel, owner: user.id, topic: "", topicBy: me.nick, topicAt: iso(now()), ops: [user.id], kicked: [] });
        if (!inChannel(cmd.channel)) {
          await store.put<Member>("irc.members", { id: `${user.id}:${cmd.channel}`, owner: user.id, channel: cmd.channel, joinedAt: iso(now()) });
          await post(cmd.channel, "join", "");
        }
        open(cmd.channel);
        if (!ch.exists) notice(`You created ${cmd.channel} and you're its channel operator. Set a topic with /topic.`, cmd.channel);
        return;
      }
      case "part": {
        const ch = cmd.channel ?? here;
        if (!isChannel(ch)) return closeWindow(here);
        if (inChannel(ch)) {
          await post(ch, "part", "");
          await store.delete("irc.members", `${user.id}:${ch}`);
        }
        return closeWindow(ch);
      }
      case "nick": {
        const taken = RESERVED_NICKS.has(cmd.nick.toLowerCase()) || nicks.some((n) => n.owner !== user.id && n.nick.toLowerCase() === cmd.nick.toLowerCase());
        if (taken) return notice(`The nickname ${cmd.nick} is already taken. Try another one.`);
        const old = me.nick;
        await store.put<NickRecord>("irc.nicks", { ...me, nick: cmd.nick });
        for (const m of members.filter((x) => x.owner === user.id)) await post(m.channel, "nick", cmd.nick, old);
        return notice(`You are now known as ${cmd.nick}.`);
      }
      case "topic": {
        if (!isChannel(here)) return notice("Topics belong to channels. Switch to a channel first.");
        if (!cmd.text) return notice(info.topic ? `Topic for ${here}: ${info.topic} (set by ${info.topicBy})` : `${here} has no topic yet.`);
        if (info.archive || !info.ops.includes(user.id)) return notice(`Only channel operators can change the topic of ${here}.`);
        const rec = channelRecords.find((c) => c.id === here)!;
        await store.put<ChannelRecord>("irc.channels", { ...rec, topic: cmd.text.slice(0, 200), topicBy: me.nick, topicAt: iso(now()) });
        return post(here, "topic", cmd.text);
      }
      case "msg": {
        if (cmd.to.startsWith("#")) {
          if (!inChannel(cmd.to.toLowerCase())) return notice(`You're not in ${cmd.to}.`);
          return post(cmd.to.toLowerCase(), "msg", cmd.text);
        }
        const target = nicks.find((n) => n.nick.toLowerCase() === cmd.to.toLowerCase());
        if (!target) return notice(`No one called ${cmd.to} is on the network right now. Only people with an account on this computer can chat live.`);
        if (target.owner === user.id) return notice("That's you! Talking to yourself is allowed, but nobody will answer.");
        const key = pmKey(user.id, target.owner);
        open(key);
        await post(key, "msg", cmd.text);
        if (target.away) notice(`${target.nick} is away: ${target.away}`, key);
        return;
      }
      case "away":
        await store.put<NickRecord>("irc.nicks", { ...me, away: cmd.text.slice(0, 120) });
        return notice(`You're marked as away: ${cmd.text}`);
      case "back":
        await store.put<NickRecord>("irc.nicks", { ...me, away: null });
        return notice("Welcome back! You're no longer marked as away.");
      case "kick": {
        if (!isChannel(here)) return notice("You can only kick people from a channel.");
        if (info.archive || !info.ops.includes(user.id)) return notice(`Only channel operators can kick people from ${here}.`);
        const target = nicks.find((n) => n.nick.toLowerCase() === cmd.nick.toLowerCase());
        if (!target || !inChannel(here, target.owner)) return notice(`${cmd.nick} isn't in ${here}.`);
        if (target.owner === user.id) return notice("You can't kick yourself. Use /part to leave.");
        const rec = channelRecords.find((c) => c.id === here)!;
        await store.put<ChannelRecord>("irc.channels", { ...rec, kicked: [...rec.kicked, target.owner] });
        await store.delete("irc.members", `${target.owner}:${here}`);
        return post(here, "kick", `${target.nick} was removed by ${me.nick}${cmd.reason ? ` (${cmd.reason})` : ""}`);
      }
      case "list": {
        const names = [...new Set([...archiveChannels.map((c) => c.name), ...channelRecords.map((c) => c.id)])].sort();
        notice(`Channels on ${NETWORK}:`);
        for (const n of names) notice(`${n} (${members.filter((m) => m.channel === n).length} here) ${channelInfo(n).topic}`);
        return;
      }
      case "names": {
        if (!isChannel(here)) return notice("Switch to a channel to see who's there.");
        const who = members.filter((m) => m.channel === here).map((m) => `${info.ops.includes(m.owner) ? "@" : ""}${nickOf(m.owner)}${nicks.find((n) => n.owner === m.owner)?.away ? " (away)" : ""}`);
        return notice(who.length ? `In ${here}: ${who.join(", ")}` : `Nobody is in ${here} right now.`);
      }
      case "clear":
        return setCleared((c) => ({ ...c, [here]: iso(now()) }));
      case "help":
        notice("Relay Chat commands:");
        for (const h of HELP) notice(h);
        return;
      case "error":
        return notice(cmd.message);
    }
  };

  const closeWindow = (w: string) => {
    const rest = profile.windows.filter((x) => x !== w);
    void setProfile({ windows: rest.length ? rest : ["#general"], current: rest[0] ?? "#general" });
  };

  const saveLog = async () => {
    if (!vfs || !folders) return;
    const text = exportLog(`${titleOf(window_)} on ${NETWORK}`, shown, (at) => `${formatDate(Date.parse(at), zone)} ${formatTime(Date.parse(at), zone)}`);
    const node = await vfs.writeFile(folders.documents, await vfs.uniqueName(folders.documents, `${titleOf(window_).replace(/[#:]/g, "")} chat log.txt`), text, { mime: "text/plain" });
    notify({ title: "Chat log saved", body: `${node.name} is in your Documents folder.` });
  };

  const people = isChannel(window_) ? members.filter((m) => m.channel === window_) : [];
  const info = channelInfo(window_);
  const unreadFor = (w: string) => (w === window_ ? 0 : lines.filter((l) => l.target === w && l.owner !== user?.id && Date.parse(l.at) <= t && l.at > (cleared[w] ?? "")).length > 0);

  return (
    <div className="relay-chat">
      <nav className="rc-windows" aria-label="Channels and conversations">
        <div className="rc-network">{NETWORK}</div>
        {profile.windows.map((w) => (
          <button key={w} className={`rc-win${w === window_ ? " on" : ""}${unreadFor(w) ? " new" : ""}`} onClick={() => setProfile({ ...profile, current: w })}>
            {isChannel(w) ? w : `@ ${titleOf(w)}`}
          </button>
        ))}
        <div className="rc-hint">Type /join #anime, /list or /help</div>
      </nav>
      <main className="rc-main">
        <div className="rc-topic" title={info.topic}>
          {isChannel(window_) ? (info.topic ? info.topic : "No topic set") : `Private conversation with ${titleOf(window_)}`}
          <span className="rc-tools">
            <button className="link-btn" onClick={saveLog}>
              Save log
            </button>
            {window_ !== "#general" && (
              <button className="link-btn" onClick={() => run(isChannel(window_) ? `/part ${window_}` : "/part")}>
                {isChannel(window_) ? "Leave" : "Close"}
              </button>
            )}
          </span>
        </div>
        <div className="rc-log" ref={scroller} role="log" aria-live="polite">
          {shown.map((l, i) => {
            const day = formatDate(Date.parse(l.at), zone);
            const newDay = i === 0 || formatDate(Date.parse(shown[i - 1].at), zone) !== day;
            return (
              <div key={`${l.at}-${i}`}>
                {newDay && <div className="rc-day">{day}</div>}
                <div className={`rc-line ${l.kind}`}>
                  <span className="rc-time">[{formatTime(Date.parse(l.at), zone)}]</span> {describe(l)}
                </div>
              </div>
            );
          })}
        </div>
        <form
          className="rc-input"
          onSubmit={(e) => {
            e.preventDefault();
            const line = input;
            setInput("");
            void run(line);
          }}
        >
          <span className="rc-nick">{me?.nick ?? "…"}</span>
          <input className="field" value={input} onChange={(e) => setInput(e.target.value)} aria-label="Message" placeholder={isChannel(window_) ? `Message ${window_}` : `Message ${titleOf(window_)}`} autoFocus maxLength={500} />
          <button className="btn" disabled={!input.trim()}>
            Send
          </button>
        </form>
      </main>
      {isChannel(window_) && (
        <aside className="rc-people" aria-label="People here">
          <div className="rc-people-head">{people.length} here</div>
          {people.map((m) => {
            const n = nicks.find((x) => x.owner === m.owner);
            return (
              <div key={m.id} className={n?.away ? "away" : ""} title={n?.away ? `Away: ${n.away}` : undefined}>
                {info.ops.includes(m.owner) ? "@" : ""}
                {n?.nick ?? "someone"}
              </div>
            );
          })}
          {info.archive && <p className="rc-people-note">The regulars in the scrollback aren&apos;t online right now. Everyone with an account on this computer can chat here live.</p>}
        </aside>
      )}
    </div>
  );
}
