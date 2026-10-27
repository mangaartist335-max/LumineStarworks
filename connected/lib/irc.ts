// Relay Chat's rules, free of React: commands, nicknames, channel names and
// plain-text logs.

export type Command =
  | { kind: "say"; text: string }
  | { kind: "me"; text: string }
  | { kind: "join"; channel: string }
  | { kind: "part"; channel?: string }
  | { kind: "nick"; nick: string }
  | { kind: "topic"; text?: string }
  | { kind: "msg"; to: string; text: string }
  | { kind: "away"; text: string }
  | { kind: "back" }
  | { kind: "kick"; nick: string; reason?: string }
  | { kind: "list" }
  | { kind: "names" }
  | { kind: "clear" }
  | { kind: "help" }
  | { kind: "error"; message: string };

export const HELP = [
  "/join #channel  join or create a channel",
  "/part  leave the current channel",
  "/nick name  change your nickname",
  "/topic text  set the channel topic (channel operators)",
  "/msg nick text  send a private message",
  "/me does something  describe an action",
  "/away message  mark yourself away, /back when you return",
  "/kick nick  remove someone from your channel (channel operators)",
  "/list  show channels, /names  who's here, /clear  clear the window",
];

const NICK = /^[A-Za-z[\]\\`_^{|}][A-Za-z0-9[\]\\`_^{|}-]{0,15}$/;
const CHANNEL = /^#[A-Za-z0-9_-]{1,24}$/;

export const validNick = (n: string) => NICK.test(n);
export const validChannel = (c: string) => CHANNEL.test(c);
export const normalizeChannel = (c: string) => (c.startsWith("#") ? c : `#${c}`).toLowerCase();

/** Turns a typed line into a command. Plain text is a message to the current window. */
export function parseLine(line: string): Command | null {
  const text = line.trim();
  if (!text) return null;
  if (!text.startsWith("/") || text.startsWith("//")) return { kind: "say", text: text.startsWith("//") ? text.slice(1) : text };
  const [rawCmd, ...rest] = text.slice(1).split(" ");
  const cmd = rawCmd.toLowerCase();
  const arg = rest.join(" ").trim();
  switch (cmd) {
    case "me":
      return arg ? { kind: "me", text: arg } : { kind: "error", message: "Usage: /me does something" };
    case "join":
    case "j": {
      const ch = normalizeChannel(rest[0] ?? "");
      return validChannel(ch) ? { kind: "join", channel: ch } : { kind: "error", message: "Channel names start with # and use letters, numbers, - or _ (up to 24)." };
    }
    case "part":
    case "leave":
      return { kind: "part", channel: rest[0] ? normalizeChannel(rest[0]) : undefined };
    case "nick":
      return validNick(arg) ? { kind: "nick", nick: arg } : { kind: "error", message: "Nicknames are 1 to 16 characters: letters, numbers and _-[]{}|^`, not starting with a number." };
    case "topic":
      return { kind: "topic", text: arg || undefined };
    case "msg":
    case "query": {
      const [to, ...words] = rest;
      const body = words.join(" ").trim();
      return to && body ? { kind: "msg", to, text: body } : { kind: "error", message: "Usage: /msg nick message" };
    }
    case "away":
      return arg ? { kind: "away", text: arg } : { kind: "back" };
    case "back":
      return { kind: "back" };
    case "kick": {
      const [nick, ...why] = rest;
      return nick ? { kind: "kick", nick, reason: why.join(" ").trim() || undefined } : { kind: "error", message: "Usage: /kick nick [reason]" };
    }
    case "list":
      return { kind: "list" };
    case "names":
    case "who":
      return { kind: "names" };
    case "clear":
      return { kind: "clear" };
    case "help":
      return { kind: "help" };
    default:
      return { kind: "error", message: `Unknown command /${cmd}. Type /help to see what's available.` };
  }
}

export interface LogLine {
  at: string;
  nick: string;
  kind: "msg" | "action" | "join" | "part" | "nick" | "topic" | "kick" | "notice";
  text: string;
}

/** One line as the chat window and the saved log show it. */
export function describe(l: LogLine): string {
  switch (l.kind) {
    case "msg":
      return `<${l.nick}> ${l.text}`;
    case "action":
      return `* ${l.nick} ${l.text}`;
    case "join":
      return `--> ${l.nick} has joined`;
    case "part":
      return `<-- ${l.nick} has left`;
    case "nick":
      return `--- ${l.nick} is now known as ${l.text}`;
    case "topic":
      return `--- ${l.nick} set the topic: ${l.text}`;
    case "kick":
      return `--- ${l.text}`;
    default:
      return `-${l.nick}- ${l.text}`;
  }
}

/** The plain-text log of a window, with times in `format`. */
export function exportLog(title: string, lines: LogLine[], format: (at: string) => string): string {
  return [`Relay Chat log: ${title}`, "", ...lines.map((l) => `[${format(l.at)}] ${describe(l)}`), ""].join("\n");
}
