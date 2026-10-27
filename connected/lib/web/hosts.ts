// Web addresses of the Connected Era's own sites.
//
// Every fictional site lives under connectedera.local, a reserved name that
// can never collide with a real website (Master Bible ch. 20: "use reserved
// development hostnames that cannot conflict with live commercial sites").

export const DOMAIN = "connectedera.local";

export const HOST = {
  search: `search.${DOMAIN}`,
  metube: `metube.${DOMAIN}`,
  yal: `yal.${DOMAIN}`,
  manga: `manga.${DOMAIN}`,
  wallpapers: `wallpapers.${DOMAIN}`,
  birdie: `birdie.${DOMAIN}`,
  tum: `tum.${DOMAIN}`,
  chan: `3chan.${DOMAIN}`,
  technook: `technook.${DOMAIN}`,
  homeplot: `homeplot.${DOMAIN}`,
  inkpocket: `inkpocket.${DOMAIN}`,
  freeware: `freewarecorner.${DOMAIN}`,
  recipes: `pantryrecipes.${DOMAIN}`,
  mail: `mail.${DOMAIN}`,
  aniwire: `aniwire.${DOMAIN}`,
  flow: `flowpictures.${DOMAIN}`,
  wiki: `wiki.${DOMAIN}`,
} as const;

/** Email addresses on this computer: name@mail.connectedera.local */
export const MAIL_DOMAIN = HOST.mail;

/** Addresses used by early builds, so old bookmarks still find their site. */
export const LEGACY_HOSTS: Record<string, string> = {
  "goggle.com": HOST.search,
  "metube.com": HOST.metube,
  "youranimelist.net": HOST.yal,
  "mangashelf.net": HOST.manga,
  "wallpapergarden.com": HOST.wallpapers,
  "birdie.com": HOST.birdie,
  "tum.com": HOST.tum,
  "3chan.org": HOST.chan,
  "technook.net": HOST.technook,
  "homeplot.net": HOST.homeplot,
  "inkpocket.net": HOST.inkpocket,
  "freewarecorner.com": HOST.freeware,
  "pantryrecipes.com": HOST.recipes,
  "connectmail.net": HOST.mail,
};

/** Mail addresses from before the move keep working: name@connectmail.net is name@mail.connectedera.local. */
export function upgradeLegacyEmail(email: string): string {
  return email.replace(/@connectmail\.net$/i, `@${MAIL_DOMAIN}`);
}

export const isArchiveHost = (host: string) => host === DOMAIN || host.endsWith(`.${DOMAIN}`);

/** The current address for a link saved under an old host, or null if it isn't one. */
export function upgradeLegacyUrl(href: string): string | null {
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  for (const [old, next] of Object.entries(LEGACY_HOSTS)) {
    if (host === old) return `http://${next}${u.pathname}${u.search}${u.hash}`;
    if (host.endsWith(`.${old}`)) return `http://${host.slice(0, -old.length)}${next}${u.pathname}${u.search}${u.hash}`;
  }
  return null;
}
