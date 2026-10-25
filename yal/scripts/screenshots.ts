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

const SHOTS: { name: string; path: string; asof: string; full?: boolean; width?: number }[] = [
  { name: "01-ep1-discussion", path: "/forum/thread/ioe-ep1", asof: "2013-10-24T12:00" },
  { name: "02-ep2-discussion", path: "/forum/thread/ioe-ep2", asof: "2013-10-24T12:00" },
  { name: "03-ep3-discussion", path: "/forum/thread/ioe-ep3", asof: "2013-10-24T12:00" },
  { name: "04-sinful-apex", path: "/anime/10380/Sinful_Apex", asof: "2013-10-24T12:00", full: true },
  { name: "05-nightpolis-winter-ova", path: "/anime/1043/Impact_of_Eden__Nightpolis_Winter", asof: "2013-10-24T12:00", full: true },
  { name: "06-home", path: "/", asof: "2013-10-24T12:00", full: true },
  { name: "07-fall-2013", path: "/anime/season/2013/fall", asof: "2013-10-24T12:00" },
  { name: "08-character-miyuki", path: "/character/4/Miyuki_Kagemitsu", asof: "2013-10-24T12:00" },
  { name: "09-forums", path: "/forum", asof: "2013-10-24T12:00" },
  { name: "10-ep1-at-0300", path: "/forum/thread/ioe-ep1", asof: "2013-10-06T03:00" },
  { name: "11-glass-cathedral-before-premiere", path: "/anime/4407/Glass_Cathedral", asof: "2012-01-05T12:00" },
  { name: "12-ep1-mobile", path: "/forum/thread/ioe-ep1", asof: "2013-10-24T12:00", width: 390 },
  { name: "13-impact-of-eden-coming-soon", path: "/anime/19815/Impact_of_Eden", asof: "2013-10-24T12:00" },
  { name: "14-vacant-crown", path: "/anime/9871/Vacant_Crown__Liminal_War", asof: "2013-10-24T12:00", full: true },
  { name: "15-summer-2012", path: "/anime/season/2012/summer", asof: "2012-08-01T12:00" },
  { name: "16-vacant-crown-finale-thread", path: "/forum/thread/t-28655", asof: "2013-10-24T12:00" },
];

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
  for (const s of SHOTS) {
    const page = await browser.newPage({ viewport: { width: s.width ?? 1280, height: 1000 } });
    await page.goto(`${BASE}${s.path}?asof=${encodeURIComponent(s.asof)}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT, `${s.name}.png`), fullPage: Boolean(s.full) });
    await page.close();
    console.log(`captured ${s.name}`);
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
