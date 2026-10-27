// Finding web addresses in plain text (chats, posts, mail) so they can be
// shown as links. Archive addresses (anything.connectedera.local) and
// ordinary live-web addresses are both recognised.

/** Matches http(s) URLs, www. addresses, archive hosts and bare .com/.net/.org hosts. */
export const LINK_PATTERN = /((?:https?:\/\/|www\.)[^\s]+|\b(?:[a-z0-9-]+\.)+connectedera\.local(?:\/[^\s]*)?|\b[a-z0-9-]+\.(?:com|net|org)(?:\/[^\s]*)?)/gi;

/** Trailing punctuation that belongs to the sentence, not the address. */
export const trimLink = (raw: string) => raw.replace(/[.,!?)]+$/, "");

/** A clickable address for what was typed: adds http:// (and www. for bare live-web names). */
export function linkHref(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/connectedera\.local/i.test(raw) || /^www\./i.test(raw)) return `http://${raw}`;
  return `http://www.${raw}`;
}

export const containsLink = (text: string) => new RegExp(LINK_PATTERN.source, "i").test(text);
