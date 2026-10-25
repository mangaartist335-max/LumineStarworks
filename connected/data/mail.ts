// Mail that arrives in a new ConnectMail inbox. Some messages come a few
// minutes after the account is created (a welcome note, a hello from a
// friend); newsletters arrive on their dates while the account exists, so
// moving the clock forward brings in later ones.

import { media } from "./media";

export interface ArchiveAttachment {
  name: string;
  mime: string;
  url: string;
  size: number;
}

export interface ArchiveMail {
  id: string;
  from: { name: string; email: string };
  subject: string;
  body: string;
  attachments?: ArchiveAttachment[];
  /** Minutes after the account was created, or a fixed date. */
  deliver: { afterMinutes: number } | { at: string };
}

const attach = (key: string, name: string, mime: string): ArchiveAttachment => {
  const e = media(key);
  return { name, mime, url: e.url, size: e.size };
};

export const archiveMail: ArchiveMail[] = [
  {
    id: "mail_welcome",
    from: { name: "ConnectMail Team", email: "welcome@connectmail.net" },
    subject: "Welcome to ConnectMail!",
    body: `Hi there,

Welcome to ConnectMail, the email that comes with your Connected PC. A few things to try:

- Click New to write an email. You can attach pictures and documents from your computer.
- Email anyone who has an account on this computer. Their address is shown in Control Panel > User Accounts.
- Make folders for the mail you want to keep, and use the search box to find anything.

We've attached a short guide to your new PC. Have fun!

The ConnectMail Team
www.connectmail.net`,
    attachments: [attach("doc:welcome-pdf", "Welcome to your Connected PC.pdf", "application/pdf")],
    deliver: { afterMinutes: 0 },
  },
  {
    id: "mail_dana_hello",
    from: { name: "Dana", email: "dana.doodles@connectmail.net" },
    subject: "hiii + a sketch for you",
    body: `Hey!!

So glad you're on Messenger now :D I finished this little sketch of Mochi the cat from the Hendersons' laser pointer video and thought you'd like it. Use it as a background if you want, it's yours!

Also there's a site called WallpaperGarden with tons of free backgrounds, the autumn ones are so cosy.

talk soon,
Dana ✿`,
    attachments: [attach("art:mochi-sketch", "mochi-sketch.jpg", "image/jpeg")],
    deliver: { afterMinutes: 3 },
  },
  {
    id: "mail_tom_tips",
    from: { name: "Tom (TechTips)", email: "techtips.tom@connectmail.net" },
    subject: "5 quick tips for your new PC",
    body: `Hi! Tom here from TechTips. Since you're new, here are my five favourite tricks:

1. Right-click any picture and choose "Set as desktop background".
2. Lost a download? Open Explorer, it's in the Downloads folder on the left.
3. Ctrl+T opens a new browser tab, Ctrl+D bookmarks the page you're on.
4. Right-click files and pick "Add to ZIP archive" to bundle them up for email.
5. Restarting really does fix most things :)

Happy computing!
Tom`,
    deliver: { afterMinutes: 10 },
  },
  {
    id: "mail_mangashelf_2012_09",
    from: { name: "MangaShelf", email: "news@mangashelf.net" },
    subject: "New chapter: Lantern Street Couriers, Chapter 2",
    body: `Lantern Street Couriers Chapter 2: "Rooftop Shortcut" is out now!

Mei finds a faster route across the rooftops of Lantern Street, and there may be melon bread involved.

Read it free: www.mangashelf.net/manga/lantern-street-couriers

You're getting this because you have a ConnectMail account. Happy reading!`,
    deliver: { at: "2012-09-07T05:00:00Z" },
  },
  {
    id: "mail_freeware_2012_11",
    from: { name: "Freeware Corner", email: "newsletter@freewarecorner.com" },
    subject: "Just released: Star Courier (free arcade game)",
    body: `This week on Freeware Corner:

STAR COURIER by Tinybolt Games
Fly parcels across an asteroid field, dodge the rocks and take on the boss on level 4. Free, small download, works great on Connected PCs.

Get it here: www.freewarecorner.com/games/star-courier

Have a great weekend!
The Freeware Corner team`,
    deliver: { at: "2012-11-20T18:00:00Z" },
  },
  {
    id: "mail_mangashelf_2013_01",
    from: { name: "MangaShelf", email: "news@mangashelf.net" },
    subject: "New series: Paper Planet",
    body: `A brand new series just started on MangaShelf!

PAPER PLANET, Chapter 1: "Fold Here"
A boy folds a planet. A small one. What happens next is up to Pip.

Read it free: www.mangashelf.net/manga/paper-planet`,
    deliver: { at: "2013-01-11T05:00:00Z" },
  },
  {
    id: "mail_wallgarden_2013_09",
    from: { name: "WallpaperGarden", email: "hello@wallpapergarden.com" },
    subject: "Autumn is here: new wallpapers 🍂",
    body: `Fresh on WallpaperGarden this month:

"Autumn Path" by Aya Morita - a quiet path through glowing autumn trees.

Download it free: www.wallpapergarden.com/wallpaper/autumn-path

Enjoy the season!
WallpaperGarden`,
    deliver: { at: "2013-09-02T14:00:00Z" },
  },
  {
    id: "mail_metube_2013_10",
    from: { name: "MeTube", email: "noreply@metube.com" },
    subject: "Your weekly MeTube highlights",
    body: `Here's what's popular on MeTube this week:

- Biscuit's First Snow Day! (TheHendersonsHome)
- Summer Rain - Original Piano Piece (AkiraKeys)
- Star Courier - Levels 1-3 Walkthrough (PixelPilotGaming)

Watch now at www.metube.com

Broadcast Yourself.`,
    deliver: { at: "2013-10-05T15:00:00Z" },
  },
  {
    id: "mail_mangashelf_2013_11",
    from: { name: "MangaShelf", email: "news@mangashelf.net" },
    subject: "Paper Planet, Chapter 2 is out!",
    body: `Paper Planet Chapter 2 is out now on MangaShelf.

Pip's planet gets its first weather. It's mostly confetti.

Read it free: www.mangashelf.net/manga/paper-planet`,
    deliver: { at: "2013-11-08T05:00:00Z" },
  },
  {
    id: "mail_connectmail_2013_12",
    from: { name: "ConnectMail Team", email: "welcome@connectmail.net" },
    subject: "Happy holidays from ConnectMail ❄",
    body: `Season's greetings!

Thanks for using ConnectMail this year. Why not send a holiday note to the people on your computer? Click New, type their address and add a picture.

Warm wishes,
The ConnectMail Team`,
    deliver: { at: "2013-12-20T15:00:00Z" },
  },
];

/** When an archive message arrives for an account created at `createdAt`; null if it never does. */
export function deliveryTime(m: ArchiveMail, createdAt: number): number | null {
  if ("afterMinutes" in m.deliver) return createdAt + m.deliver.afterMinutes * 60_000;
  const at = Date.parse(m.deliver.at);
  return at >= createdAt ? at : null;
}
