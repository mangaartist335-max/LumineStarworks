// Capture the screenshot-comparison set against a running dev server.
//
//   npm run dev            (in another terminal)
//   npm run screenshots    (writes to screenshots/)
//
// Each page is captured at the archive moment noted below so the result is
// reproducible. Uses the Playwright that ships with the environment.

import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.env.YAL_URL ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "screenshots");

type Shot = { name: string; path: string; asof: string; full?: boolean; width?: number };

const SHOTS: Shot[] = [
  { name: "01-sinful-apex-finale-thread", path: "/forum/thread/t-21990", asof: "2013-10-24T12:00" },
  { name: "02-glass-cathedral-finale-thread", path: "/forum/thread/t-24410", asof: "2013-10-24T12:00" },
  { name: "03-iron-to-requiem", path: "/anime/16592/Iron_to_Requiem", asof: "2013-06-01T12:00", full: true },
  { name: "04-sinful-apex", path: "/anime/10380/Sinful_Apex", asof: "2013-10-24T12:00", full: true },
  { name: "05-character-nico-vale", path: "/character/124/Nico_Vale", asof: "2013-10-24T12:00" },
  { name: "06-home", path: "/", asof: "2013-10-24T12:00", full: true },
  { name: "07-spring-2013", path: "/anime/season/2013/spring", asof: "2013-05-01T12:00" },
  { name: "08-company-flow-pictures", path: "/company/2/Flow_Pictures", asof: "2013-10-24T12:00" },
  { name: "09-forums", path: "/forum", asof: "2013-10-24T12:00" },
  { name: "10-finale-thread-at-0300", path: "/forum/thread/t-21990", asof: "2012-01-24T03:00" },
  { name: "11-glass-cathedral-before-premiere", path: "/anime/4407/Glass_Cathedral", asof: "2012-01-05T12:00" },
  { name: "12-thread-mobile", path: "/forum/thread/t-21990", asof: "2013-10-24T12:00", width: 390 },
  { name: "13-about-the-archive", path: "/timemachine", asof: "2013-10-24T12:00" },
  { name: "14-vacant-crown", path: "/anime/9871/Vacant_Crown__Liminal_War", asof: "2013-10-24T12:00", full: true },
  { name: "15-summer-2012", path: "/anime/season/2012/summer", asof: "2012-08-01T12:00" },
  { name: "16-vacant-crown-finale-thread", path: "/forum/thread/t-28655", asof: "2013-10-24T12:00" },
];

// Impact of Eden belongs to a later development phase. Its reference shots
// live in screenshots/future-phase/impact-of-eden/ and are only recaptured
// when the server runs with NEXT_PUBLIC_LUMINE_FUTURE_PHASES=impact-of-eden.
const FUTURE_SHOTS: Shot[] = [
  { name: "01-ep1-discussion", path: "/forum/thread/ioe-ep1", asof: "2013-10-24T12:00" },
  { name: "02-ep2-discussion", path: "/forum/thread/ioe-ep2", asof: "2013-10-24T12:00" },
  { name: "03-ep3-discussion", path: "/forum/thread/ioe-ep3", asof: "2013-10-24T12:00" },
  { name: "05-nightpolis-winter-ova", path: "/anime/1043/Impact_of_Eden__Nightpolis_Winter", asof: "2013-10-24T12:00", full: true },
  { name: "08-character-miyuki", path: "/character/4/Miyuki_Kagemitsu", asof: "2013-10-24T12:00" },
  { name: "10-ep1-at-0300", path: "/forum/thread/ioe-ep1", asof: "2013-10-06T03:00" },
  { name: "12-ep1-mobile", path: "/forum/thread/ioe-ep1", asof: "2013-10-24T12:00", width: 390 },
  { name: "13-impact-of-eden-coming-soon", path: "/anime/19815/Impact_of_Eden", asof: "2013-10-24T12:00" },
];
const FUTURE = process.env.NEXT_PUBLIC_LUMINE_FUTURE_PHASES?.includes("impact-of-eden") ?? false;

// Minimal types for the environment's pre-installed Playwright (not a project dependency).
type Page = {
  goto(url: string, opts: { waitUntil: "networkidle" }): Promise<unknown>;
  screenshot(opts: { path: string; fullPage: boolean }): Promise<unknown>;
  close(): Promise<void>;
};
type Browser = { newPage(opts: { viewport: { width: number; height: number } }): Promise<Page>; close(): Promise<void> };

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require("playwright") as { chromium: { launch(): Promise<Browser> } };
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const list = FUTURE ? FUTURE_SHOTS : SHOTS;
  const out = FUTURE ? path.join(OUT, "future-phase", "impact-of-eden") : OUT;
  mkdirSync(out, { recursive: true });
  for (const s of list) {
    const page = await browser.newPage({ viewport: { width: s.width ?? 1280, height: 1000 } });
    await page.goto(`${BASE}${s.path}?asof=${encodeURIComponent(s.asof)}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(out, `${s.name}.png`), fullPage: Boolean(s.full) });
    await page.close();
    console.log(`captured ${s.name}`);
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
