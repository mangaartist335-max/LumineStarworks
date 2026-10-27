// End-to-end check of the first milestone, in a real Chromium:
//
//  1 launch the desktop   2 open the browser     3 search MeTube
//  4 play a video         5 open a second tab    6 search for a manga
//  7 read pages           8 download a wallpaper 9 find it in Downloads
// 10 set it as background 11 open Messenger      12 share the MeTube URL
// 13 close the apps       14 restart             15 bookmarks, files,
//    messages, reading progress and wallpaper are all still there
//
// Plus window controls (drag, resize, minimize, maximize, switch) and a
// full browser relaunch on the same profile.
//
// Needs the desktop running (npm run dev, or npm run dev:all to include
// YourAnimeList). Usage: node scripts/e2e.cjs [--headed]

const { chromium } = require("playwright");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const YAL = process.env.YAL_URL ?? "http://localhost:3100";
const headed = process.argv.includes("--headed");
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "connected-e2e-"));
const shots = path.join(__dirname, "..", "test-results");
fs.mkdirSync(shots, { recursive: true });

let step = 0;
const errors = [];
const ok = (msg) => console.log(`  ✔ ${msg}`);
async function run(title, fn) {
  step++;
  process.stdout.write(`${String(step).padStart(2)}. ${title}\n`);
  await fn();
}

function watch(page) {
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    // The YAL frame is optional; its absence is reported on screen, not an app error.
    if (/localhost:3100|ERR_CONNECTION_REFUSED/.test(text)) return;
    errors.push(`console: ${text.slice(0, 300)}`);
  });
}

const win = (app) => `.window[data-app="${app}"]`;
const activeTab = `${win("browser")} .tab-page:not([hidden])`;

async function closeAll(page) {
  for (let i = 0; i < 20 && (await page.locator(".window").count()); i++) await page.locator(".window").first().locator('button[aria-label="Close"]').click();
}

async function go(page, address) {
  const bar = page.locator(`${win("browser")} input[aria-label="Address and search bar"]`);
  await bar.click();
  await bar.fill(address);
  await bar.press("Enter");
}

async function bootToDesktop(page) {
  await page.goto(BASE);
  await page.waitForSelector(".desktop, input[aria-label='User name']", { timeout: 60000 });
}

(async () => {
  let context = await chromium.launchPersistentContext(profile, { headless: !headed, viewport: { width: 1366, height: 820 } });
  let page = context.pages()[0] ?? (await context.newPage());
  watch(page);
  const saved = {};

  await run("Launch the desktop", async () => {
    await bootToDesktop(page);
    await page.fill("input[aria-label='User name']", "Sam");
    await page.click("button:has-text('Start')");
    await page.waitForSelector(".desktop .taskbar", { timeout: 30000 });
    const clock = await page.locator(".clock-button").innerText();
    ok(`desktop is up, clock reads ${clock.replace(/\s+/g, " ").trim()}`);
  });

  await run("Open the browser", async () => {
    await page.dblclick('button.desktop-icon:has-text("Web Browser")');
    await page.waitForSelector(`${activeTab} .search-home, ${activeTab} .search-results`, { timeout: 30000 });
    ok("browser opened on the Connected Search home page");
  });

  await run("Search MeTube", async () => {
    await go(page, "metube.connectedera.local");
    await page.fill(`${activeTab} input[aria-label="Search MeTube"]`, "Mochi");
    await page.press(`${activeTab} input[aria-label="Search MeTube"]`, "Enter");
    await page.waitForSelector(`${activeTab} .mt-tile-title:has-text("Mochi vs. the Laser Pointer")`, { timeout: 20000 });
    ok("search results include \"Mochi vs. the Laser Pointer\"");
  });

  await run("Play a video", async () => {
    await page.click(`${activeTab} .mt-tile-title:has-text("Mochi vs. the Laser Pointer")`);
    await page.waitForSelector(`${activeTab} .mt-player video`);
    await page.click(`${activeTab} .mt-bigplay`);
    await page.waitForFunction((sel) => {
      const v = document.querySelector(sel);
      return v && !v.paused && v.currentTime > 1.5;
    }, `${activeTab} .mt-player video`, { timeout: 20000 });
    const t = await page.$eval(`${activeTab} .mt-player video`, (v) => v.currentTime.toFixed(1));
    saved.videoUrl = await page.inputValue(`${win("browser")} input[aria-label="Address and search bar"]`);
    await page.click(`${win("browser")} button[aria-label="Bookmark this page"]`);
    ok(`video is playing (${t}s in) and bookmarked: ${saved.videoUrl}`);
  });

  await run("Open a second tab", async () => {
    await page.click(`${win("browser")} button[aria-label="New tab"]`);
    await page.waitForFunction(() => document.querySelectorAll('.window[data-app="browser"] .tab').length === 2);
    ok("two tabs open");
  });

  await run("Search for a manga", async () => {
    await go(page, "manga.connectedera.local");
    await page.fill(`${activeTab} input[aria-label="Search manga"]`, "Lantern");
    await page.press(`${activeTab} input[aria-label="Search manga"]`, "Enter");
    await page.waitForSelector(`${activeTab} .ms-title-link:has-text("Lantern Street Couriers")`);
    ok("found Lantern Street Couriers");
  });

  await run("Read pages", async () => {
    await page.click(`${activeTab} .ms-title-link:has-text("Lantern Street Couriers")`);
    await page.click(`${activeTab} .ms-actions .ms-btn.primary`);
    await page.waitForSelector(`${activeTab} .ms-reader[data-page="1"] .ms-stage img`);
    // Right-to-left manga: the left side turns forward.
    await page.click(`${activeTab} .ms-turn.left`);
    await page.waitForSelector(`${activeTab} .ms-reader[data-page="2"]`);
    await page.click(`${activeTab} .ms-turn.left`);
    await page.waitForSelector(`${activeTab} .ms-reader[data-page="3"]`);
    await page.waitForFunction((sel) => document.querySelector(sel)?.complete, `${activeTab} .ms-stage img`);
    ok("turned to page 3 of chapter 1");
  });

  await run("Download a wallpaper", async () => {
    await go(page, "wallpapers.connectedera.local");
    await page.click(`${activeTab} a.wg-card:has-text("Starfield")`);
    await page.click(`${activeTab} .wg-download`);
    await page.waitForSelector('.toast:has-text("Download complete")', { timeout: 90000 });
    ok("download finished (throttled to the computer's connection speed)");
  });

  await run("Find it in Downloads", async () => {
    await page.dblclick('button.desktop-icon:has-text("Computer")');
    await page.click(`${win("explorer")} .ex-nav button:has-text("Downloads")`);
    const row = page.locator(`${win("explorer")} tr[data-name*="Starfield"]`);
    await row.waitFor();
    saved.file = await row.getAttribute("data-name");
    ok(`Downloads contains ${saved.file}`);
  });

  await run("Set it as the background", async () => {
    await page.click(`${win("explorer")} tr[data-name="${saved.file}"]`, { button: "right" });
    await page.click('.context-menu button:has-text("Set as desktop background")');
    await page.waitForFunction(() => /^file_/.test(document.querySelector(".wallpaper")?.getAttribute("data-wallpaper") ?? ""));
    await page.waitForFunction(() => /blob:/.test(document.querySelector(".wallpaper")?.style.backgroundImage ?? ""));
    saved.wallpaper = await page.getAttribute(".wallpaper", "data-wallpaper");
    ok(`desktop background is now the downloaded picture (${saved.wallpaper})`);
  });

  await run("Open Messenger", async () => {
    await page.dblclick('button.desktop-icon:has-text("Messenger")');
    await page.waitForSelector(`${win("messenger")} .im-contact[data-contact="Dana"]`);
    ok("Messenger is open with the contact list");
  });

  await run("Share the MeTube URL", async () => {
    await page.click('.task-button:has-text("Web Browser")');
    await page.click(`${win("browser")} .tab >> nth=0`);
    await page.click(`${activeTab} .mt-actions button:has-text("Share")`);
    await page.click(`${activeTab} button:has-text("Send in Messenger")`);
    await page.waitForSelector(`${win("messenger")} .im-share`);
    await page.click(`${win("messenger")} .im-contact[data-contact="Dana"]`);
    const box = page.locator(`${win("messenger")} textarea[aria-label="Message"]`);
    await page.waitForFunction((sel) => document.querySelector(sel)?.value.includes("metube.connectedera.local/watch"), `${win("messenger")} textarea[aria-label="Message"]`);
    await box.press("Enter");
    await page.waitForSelector(`${win("messenger")} .im-msg.mine .im-text a[href*="metube.connectedera.local/watch"]`);
    await page.waitForSelector(`${win("messenger")} .im-says:has-text("automatic reply")`, { timeout: 15000 });
    ok("link sent to Dana (and Dana's automatic reply arrived)");
  });

  await run("Window controls: drag, resize, minimize, maximize, switch", async () => {
    const w = page.locator(win("explorer"));
    await page.click('.task-button:has-text("Downloads")');
    await page.waitForSelector(`${win("explorer")}:not(.inactive)`);
    const before = await w.boundingBox();
    const title = await page.locator(`${win("explorer")} .titlebar`).boundingBox();
    await page.mouse.move(title.x + 200, title.y + 12);
    await page.mouse.down();
    await page.mouse.move(title.x + 320, title.y + 72, { steps: 8 });
    await page.mouse.up();
    const moved = await w.boundingBox();
    if (Math.abs(moved.x - before.x - 120) > 3 || Math.abs(moved.y - before.y - 60) > 3) throw new Error(`drag failed: ${JSON.stringify({ before, moved })}`);
    const se = await page.locator(`${win("explorer")} .resize.se`).boundingBox();
    await page.mouse.move(se.x + se.width / 2, se.y + se.height / 2);
    await page.mouse.down();
    await page.mouse.move(se.x + 80, se.y + 50, { steps: 6 });
    await page.mouse.up();
    const resized = await w.boundingBox();
    if (resized.width < moved.width + 60) throw new Error("resize failed");
    await page.click(`${win("explorer")} button[aria-label="Maximize"]`);
    await page.waitForSelector(`${win("explorer")}.maximized`);
    await page.click(`${win("explorer")} button[aria-label="Restore Down"]`);
    await page.waitForSelector(`${win("explorer")}:not(.maximized)`);
    await page.click(`${win("explorer")} button[aria-label="Minimize"]`);
    await page.waitForSelector(`${win("explorer")}.minimized`, { state: "attached" });
    await page.click('.task-button:has-text("Downloads")');
    await page.waitForSelector(`${win("explorer")}:not(.minimized):not(.inactive)`);
    await page.click('.task-button:has-text("Messenger")');
    await page.waitForSelector(`${win("messenger")}:not(.inactive)`);
    ok("moved, resized, maximized, restored, minimized and switched windows");
  });

  await run("Close the apps", async () => {
    await closeAll(page);
    if (await page.locator(".window").count()) throw new Error("windows still open");
    ok("all windows closed");
  });

  await run("Restart", async () => {
    await page.click(".start-orb");
    await page.click('button[aria-label="More power options"]');
    await page.click('.power-menu button:has-text("Restart")');
    await page.waitForSelector(".boot-screen, .power-screen", { timeout: 10000 });
    await page.waitForSelector(".desktop .taskbar", { timeout: 30000 });
    ok("the computer restarted and logged straight back in");
  });

  async function verify(label) {
    const wp = await page.getAttribute(".wallpaper", "data-wallpaper");
    if (wp !== saved.wallpaper) throw new Error(`wallpaper changed: ${wp}`);
    await page.waitForFunction(() => /blob:/.test(document.querySelector(".wallpaper")?.style.backgroundImage ?? ""));
    await page.dblclick('button.desktop-icon:has-text("Computer")');
    await page.click(`${win("explorer")} .ex-nav button:has-text("Downloads")`);
    await page.locator(`${win("explorer")} tr[data-name="${saved.file}"]`).waitFor();
    await page.dblclick('button.desktop-icon:has-text("Web Browser")');
    await page.waitForSelector(`${win("browser")} .bookmarks-bar .bookmark:has-text("Mochi")`);
    await go(page, "manga.connectedera.local");
    await page.waitForSelector(`${activeTab} .ms-continue-card:has-text("Page 3 of")`);
    await page.dblclick('button.desktop-icon:has-text("Messenger")');
    await page.click(`${win("messenger")} .im-contact[data-contact="Dana"]`);
    await page.waitForSelector(`${win("messenger")} .im-msg.mine .im-text a[href*="metube.connectedera.local/watch"]`);
    ok(`${label}: wallpaper, downloaded file, bookmark, reading progress (page 3) and messages are all still there`);
    await page.screenshot({ path: path.join(shots, `e2e-${label.replace(/\W+/g, "-").toLowerCase()}.png`) });
    await closeAll(page);
  }

  await run("Verify everything persisted", async () => verify("after restart"));

  await run("Relaunch the whole browser on the same profile", async () => {
    await context.close();
    context = await chromium.launchPersistentContext(profile, { headless: !headed, viewport: { width: 1366, height: 820 } });
    page = context.pages()[0] ?? (await context.newPage());
    watch(page);
    await bootToDesktop(page);
    await page.waitForSelector(".desktop .taskbar", { timeout: 30000 });
    await verify("after browser relaunch");
  });

  await run("Community sites: sign a guestbook, review a story, chirp", async () => {
    await page.dblclick('button.desktop-icon:has-text("Web Browser")');
    await go(page, "homeplot.connectedera.local/~skys-hangar/guestbook");
    await page.fill(`${activeTab} textarea[aria-label="Guestbook message"]`, "Hi Sky! Love the hangar.");
    await page.click(`${activeTab} button:has-text("Sign guestbook")`);
    await page.waitForSelector(`${activeTab} .hp-entry:has-text("Hi Sky! Love the hangar.")`);
    await go(page, "inkpocket.connectedera.local/s/fic_longway/2");
    await page.fill(`${activeTab} textarea[aria-label="Review"]`, "The seagull!");
    await page.click(`${activeTab} button:has-text("Post review")`);
    await page.waitForSelector(`${activeTab} .ip-review:has-text("The seagull!")`);
    await go(page, "birdie.connectedera.local");
    await page.fill(`${activeTab} textarea[aria-label="What's happening?"]`, "Reading fan fiction on InkPocket inkpocket.connectedera.local");
    await page.click(`${activeTab} .bd-btn:has-text("Chirp")`);
    await page.waitForSelector(`${activeTab} .bd-post:has-text("Reading fan fiction on InkPocket")`);
    ok("guestbook signed on HomePlot, review posted on InkPocket, chirp posted on Birdie");
    await closeAll(page);
  });

  await run("YourAnimeList opens inside the browser (optional: needs npm run dev:all)", async () => {
    const yalUp = await fetch(YAL).then((r) => r.ok).catch(() => false);
    if (!yalUp) {
      console.log(`  - skipped: YourAnimeList isn't running at ${YAL}`);
      return;
    }
    await page.dblclick('button.desktop-icon:has-text("Web Browser")');
    await go(page, "yal.connectedera.local");
    const frame = page.frameLocator(`${activeTab} .yal-frame iframe`);
    await frame.locator("body").waitFor({ timeout: 30000 });
    await page.waitForFunction(() => /YourAnimeList/.test(document.querySelector('.window[data-app="browser"] .tab.active')?.textContent ?? ""), null, { timeout: 30000 });
    ok("YourAnimeList loaded in the frame and reported its page title");
    await closeAll(page);
  });

  await context.close();
  fs.rmSync(profile, { recursive: true, force: true });
  if (errors.length) {
    console.log(`\nConsole errors (${errors.length}):\n${errors.join("\n")}`);
    process.exit(1);
  }
  console.log(`\nAll ${step} steps passed with no console errors.`);
})().catch(async (e) => {
  console.error(`\n✘ Step ${step} failed: ${e.message.split("\n")[0]}`);
  if (errors.length) console.error(errors.join("\n"));
  process.exit(1);
});
