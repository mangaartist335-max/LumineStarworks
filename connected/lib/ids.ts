// Stable identifiers.
//
// Every record carries a prefixed id. Authored archive records use fixed ids
// written into the data files (`vid_mt0001`); records people create get a
// generated one (`vid_lq3k9x2a8f4c`). The prefix says what kind of thing it
// is, so ids stay unambiguous when apps pass them to each other.

export type IdPrefix =
  | "usr" // local computer account
  | "site" // website
  | "page" // indexed web page
  | "ch" // MeTube channel
  | "vid" // video
  | "ep" // episode
  | "pl" // playlist
  | "cmt" // comment
  | "file" // virtual file or folder
  | "blob" // stored file contents
  | "post" // forum / microblog / blog post
  | "thr" // thread
  | "msg" // messenger message
  | "conv" // messenger conversation
  | "mail" // email
  | "att" // email attachment
  | "fld" // mail folder
  | "pls" // music playlist
  | "save" // game save
  | "bm" // bookmark
  | "hist" // history entry
  | "dl" // download
  | "win" // window
  | "tab" // browser tab
  | "mg" // manga title
  | "chap" // manga chapter
  | "game" // game
  | "srch"; // search history entry

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

function randomChars(n: number): string {
  const bytes = new Uint8Array(n);
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % 36];
  return out;
}

/** A new id: prefix, time component (sortable by creation) and randomness. */
export function newId(prefix: IdPrefix): string {
  return `${prefix}_${Date.now().toString(36)}${randomChars(6)}`;
}

export function idPrefix(id: string): IdPrefix | null {
  const m = /^([a-z]+)_/.exec(id);
  return (m?.[1] as IdPrefix) ?? null;
}

export function isId(id: string, prefix: IdPrefix): boolean {
  return id.startsWith(`${prefix}_`);
}
