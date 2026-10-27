// ConnectMail: messages, delivery and folders, independent of React.
//
// Mail is delivered for real between accounts on this computer. Sample
// contacts send an automatic reply (and say so). Any other address bounces
// with a delivery report, because there is no outside mail server.

import { archiveMail, deliveryTime } from "@/data/mail";
import { sampleContactByEmail } from "@/data/messenger";
import { newId } from "./ids";
import type { Store } from "./storage/types";
import { iso } from "./time";
import { upgradeLegacyEmail } from "./web/hosts";

export const COL_MAIL = "mail.messages";
export const COL_MAIL_FOLDERS = "mail.folders";

export type SystemFolder = "inbox" | "drafts" | "sent" | "archive" | "trash";
export const SYSTEM_FOLDERS: { id: SystemFolder; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "drafts", label: "Drafts" },
  { id: "sent", label: "Sent" },
  { id: "archive", label: "Archive" },
  { id: "trash", label: "Deleted" },
];

export interface Address {
  name?: string;
  email: string;
}

export interface MailAttachment {
  id: string;
  name: string;
  mime: string;
  size: number;
  /** Stored copy (user attachments) or a URL (archive attachments). */
  blobId?: string;
  url?: string;
}

export interface MailMessage {
  id: string;
  owner: string;
  folder: string;
  from: Address;
  to: Address[];
  cc: Address[];
  subject: string;
  body: string;
  at: string;
  read: boolean;
  starred?: boolean;
  attachments: MailAttachment[];
  inReplyTo?: string;
  /** "archive" = came with the Connected Era; "system" = delivery reports and automatic replies. */
  origin: "archive" | "user" | "system";
}

export interface MailFolder {
  id: string;
  owner: string;
  name: string;
}

export interface MailAccount {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i;

/** "Dana <dana@x.net>, sam@y.com" → addresses. Invalid entries are returned separately. */
export function parseAddresses(input: string): { ok: Address[]; bad: string[] } {
  const ok: Address[] = [];
  const bad: string[] = [];
  for (const raw of input.split(/[,;]/).map((s) => s.trim()).filter(Boolean)) {
    const m = /^(.*?)\s*<([^>]+)>$/.exec(raw);
    const email = (m ? m[2] : raw).trim();
    if (!EMAIL.test(email)) bad.push(raw);
    else ok.push(m && m[1] ? { name: m[1].replace(/^"|"$/g, ""), email } : { email });
  }
  return { ok, bad };
}

export const formatAddress = (a: Address) => (a.name ? `${a.name} <${a.email}>` : a.email);
export const formatAddresses = (list: Address[]) => list.map(formatAddress).join(", ");

export function replySubject(subject: string, kind: "reply" | "forward"): string {
  const prefix = kind === "reply" ? "Re: " : "Fw: ";
  return new RegExp(`^${prefix.trim()}`, "i").test(subject) ? subject : `${prefix}${subject}`;
}

export function quoteBody(m: MailMessage, zoneFormat: (t: number) => string): string {
  const quoted = m.body
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n");
  return `\n\nOn ${zoneFormat(Date.parse(m.at))}, ${m.from.name ?? m.from.email} wrote:\n${quoted}`;
}

/** Puts archive mail that is now due into the account's inbox. Returns the new messages. */
export async function deliverArchiveMail(store: Store, account: MailAccount, now: number): Promise<MailMessage[]> {
  const key = `mail-delivered:${account.id}`;
  const done = new Set((await store.kvGet<string[]>(key)) ?? []);
  const created = Date.parse(account.createdAt);
  const out: MailMessage[] = [];
  for (const m of archiveMail) {
    if (done.has(m.id)) continue;
    const at = deliveryTime(m, created);
    if (at === null || at > now) continue;
    const msg: MailMessage = {
      id: `${account.id}_${m.id}`,
      owner: account.id,
      folder: "inbox",
      from: m.from,
      to: [{ name: account.name, email: account.email }],
      cc: [],
      subject: m.subject,
      body: m.body,
      at: iso(at),
      read: false,
      attachments: (m.attachments ?? []).map((a, i) => ({ id: `${m.id}_att${i}`, name: a.name, mime: a.mime, size: a.size, url: a.url })),
      origin: "archive",
    };
    await store.put(COL_MAIL, msg);
    done.add(m.id);
    out.push(msg);
  }
  if (out.length) await store.kvSet(key, [...done]);
  return out;
}

export interface SendReport {
  delivered: Address[];
  automatic: Address[];
  bounced: Address[];
  sent: MailMessage;
}

/**
 * Sends a message: saves it in Sent, delivers a copy to each recipient
 * with an account here, has sample contacts answer automatically and
 * bounces everything else back with a delivery report.
 */
export async function sendMail(
  store: Store,
  sender: MailAccount,
  accounts: MailAccount[],
  draft: { to: Address[]; cc: Address[]; subject: string; body: string; attachments: MailAttachment[]; inReplyTo?: string; draftId?: string },
  now: number,
): Promise<SendReport> {
  const at = iso(now);
  const base = { from: { name: sender.name, email: sender.email }, to: draft.to, cc: draft.cc, subject: draft.subject || "(no subject)", body: draft.body, attachments: draft.attachments, inReplyTo: draft.inReplyTo };
  const sent: MailMessage = { ...base, id: draft.draftId ?? newId("mail"), owner: sender.id, folder: "sent", at, read: true, origin: "user" };
  await store.put(COL_MAIL, sent);
  const report: SendReport = { delivered: [], automatic: [], bounced: [], sent };
  const seen = new Set<string>();
  for (const addr of [...draft.to, ...draft.cc]) {
    const email = upgradeLegacyEmail(addr.email).toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    const account = accounts.find((a) => a.email.toLowerCase() === email);
    const sample = sampleContactByEmail(email);
    if (account) {
      // Each copy gets its own attachment blobs so deleting one never breaks the other.
      const attachments: MailAttachment[] = [];
      for (const a of draft.attachments) {
        if (!a.blobId) {
          attachments.push(a);
          continue;
        }
        const blob = await store.getBlob(a.blobId);
        const blobId = newId("blob");
        if (blob) await store.putBlob(blobId, blob);
        attachments.push({ ...a, id: newId("att"), blobId });
      }
      await store.put(COL_MAIL, { ...base, attachments, id: newId("mail"), owner: account.id, folder: "inbox", at, read: false, origin: "user" } satisfies MailMessage);
      report.delivered.push(addr);
    } else if (sample) {
      await store.put(COL_MAIL, {
        id: newId("mail"),
        owner: sender.id,
        folder: "inbox",
        from: { name: sample.name, email: sample.email },
        to: [base.from],
        cc: [],
        subject: replySubject(base.subject, "reply"),
        body: `Hi! Thanks so much for writing 😊\n\n${sample.name}\n\n(Automatic reply: ${sample.name} is a sample contact who comes with your account, so this message was answered automatically.)`,
        at: iso(now + 1000),
        read: false,
        attachments: [],
        inReplyTo: sent.id,
        origin: "system",
      } satisfies MailMessage);
      report.automatic.push(addr);
    } else {
      report.bounced.push(addr);
    }
  }
  if (report.bounced.length) {
    await store.put(COL_MAIL, {
      id: newId("mail"),
      owner: sender.id,
      folder: "inbox",
      from: { name: "Mail Delivery System", email: "mailer-daemon@mail.connectedera.local" },
      to: [base.from],
      cc: [],
      subject: `Undeliverable: ${base.subject}`,
      body: `Your message couldn't be delivered to:\n\n${report.bounced.map((a) => `  ${a.email}`).join("\n")}\n\nConnectMail on this computer delivers mail to the accounts on this computer and to your sample contacts. There is no outside mail server in the Connected Era, so other addresses can't be reached.\n\nYour original message is in your Sent folder.`,
      at: iso(now + 500),
      read: false,
      attachments: [],
      inReplyTo: sent.id,
      origin: "system",
    } satisfies MailMessage);
  }
  return report;
}

export function matchesSearch(m: MailMessage, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [m.subject, m.body, m.from.name ?? "", m.from.email, ...m.to.map(formatAddress), ...m.attachments.map((a) => a.name)].join("\n").toLowerCase().includes(s);
}
