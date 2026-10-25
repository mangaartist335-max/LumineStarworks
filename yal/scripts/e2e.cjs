/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');
// End-to-end walkthrough against a running server (uses the pre-installed Playwright).
//   npm run dev   then   npm run e2e
// Creates a throwaway account in the current store; run npm run yal:reset-local afterwards.
const BASE = process.env.YAL_URL || 'http://localhost:3000';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push('pageerror ' + p.url() + ' ' + e));
  p.on('console', m => { if (m.type() === 'error') errors.push('console ' + p.url() + ' ' + (m.text().includes('hydrated') ? m.text().slice(0, 5000) : m.text().slice(0, 300))); });
  const step = async (name, fn) => { try { await fn(); console.log('PASS', name); } catch (e) { process.exitCode = 1; console.log('FAIL', name, String(e).slice(0, 400)); } };
  const travel = async (iso) => { await p.goto(BASE + '/?asof=' + encodeURIComponent(iso)); };
  const user = 'TestOtaku' + Date.now().toString().slice(-5);

  await travel('2013-10-24T12:00');
  await step('home renders', async () => { await p.goto(BASE + '/'); await p.getByText('Fall 2013 Anime').first().waitFor(); });
  await step('register', async () => {
    await p.goto(BASE + '/register');
    await p.fill('#reg-username', user);
    await p.fill('#reg-email', user.toLowerCase() + '@example.com');
    await p.fill('#reg-password', 'hunter2hunter2');
    await p.fill('#reg-password2', 'hunter2hunter2');
    await p.check('input[name=terms]');
    await p.click('button:has-text("Sign Up")');
    await p.waitForURL(/\/profile\//);
    await p.getByText('Welcome to YourAnimeList').waitFor();
  });
  await step('reserved archive username rejected', async () => {
    const p2 = await (await b.newContext()).newPage();
    await p2.goto(BASE + '/register');
    await p2.fill('#reg-username', 'NekoToast92');
    await p2.fill('#reg-email', 'x' + Date.now() + '@example.com');
    await p2.fill('#reg-password', 'hunter2hunter2');
    await p2.fill('#reg-password2', 'hunter2hunter2');
    await p2.check('input[name=terms]');
    await p2.click('button:has-text("Sign Up")');
    await p2.getByText('already taken').waitFor();
  });
  await step('add to list', async () => {
    await p.goto(BASE + '/anime/19815/Impact_of_Eden');
    await p.click('button:has-text("Add to My List")');
    await p.getByText('On your list:').waitFor();
  });
  await step('edit list entry', async () => {
    await p.goto(BASE + '/ownlist/anime/19815/edit');
    await p.fill('#le-eps', '3');
    await p.selectOption('#le-score', '9');
    await p.fill('#le-notes', 'Waiting for Sunday!');
    await p.click('button:has-text("Update")');
    await p.waitForURL(/\/animelist\//);
    await p.getByText('Your list has been updated').waitFor();
    await p.getByText('3/25').waitFor();
  });
  await step('spoiler toggle', async () => {
    await p.goto(BASE + '/forum/thread/ioe-ep1');
    const sp = p.locator('#p14 .spoiler');
    await sp.locator('button.spoiler-toggle').click();
    await sp.locator('.spoiler-body').getByText('necklace').waitFor({ state: 'visible' });
  });
  await step('sort newest first', async () => {
    await p.goto(BASE + '/forum/thread/ioe-ep1');
    await p.selectOption('#sort', 'newest');
    await p.waitForURL(/sort=newest/);
    await p.locator('#p1113').waitFor();
  });
  await step('pagination', async () => {
    await p.goto(BASE + '/forum/thread/ioe-ep1?page=2');
    await p.locator('#p21').waitFor();
    await p.getByText('Page 2 of 56').first().waitFor();
  });
  await step('quote + reply', async () => {
    await p.goto(BASE + '/forum/thread/ioe-ep1');
    await p.locator('#p12 .post-actions a:has-text("Quote")').click();
    await p.waitForURL(/quote=12/);
    const ta = p.locator('#reply-body');
    await ta.waitFor();
    const v = await ta.inputValue();
    if (!v.startsWith('[quote=SakugaThreadZero;12]')) throw new Error('quote not prefilled: ' + v.slice(0, 80));
    await ta.fill(v + 'Totally agree about the voice cast, and [b]Sawano[/b] too! [spoiler=tiny]hi[/spoiler]');
    await p.click('button:has-text("Post Reply")');
    await p.waitForURL(/page=last/);
    await p.getByText('[YOUR REPLY]').waitFor();
    await p.locator('.post.user-reply .quote-head:has-text("SakugaThreadZero")').waitFor();
  });
  await step('follow topic', async () => {
    await p.goto(BASE + '/forum/thread/ioe-ep2');
    await p.click('button:has-text("Follow Topic")');
    await p.locator('button:has-text("Unfollow Topic")').waitFor();
    await p.goto(BASE + '/forum/following');
    await p.getByText('FRONTIER RISK MANAGEMENT').first().waitFor();
  });
  await step('report post', async () => {
    await p.goto(BASE + '/forum/thread/ioe-ep1');
    await p.locator('#p13 .post-actions a.report').click();
    await p.fill('#report-reason', 'Manga spoiler without spoiler tags');
    await p.click('button:has-text("Send Report")');
    await p.getByText('Your report was sent').waitFor();
  });
  await step('write review', async () => {
    await p.goto(BASE + '/anime/19815/Impact_of_Eden/reviews');
    await p.fill('#rv-eps', '3');
    await p.fill('#rv-body', 'Three episodes in and this is already one of my favourite shows of the year. '.repeat(4));
    await p.click('button:has-text("Submit Review")');
    await p.waitForURL(/reviews#review-/);
    await p.getByRole('link', { name: user, exact: true }).first().waitFor();
  });
  await step('new topic', async () => {
    await p.goto(BASE + '/forum/new?board=general');
    await p.fill('#nt-title', 'Hello from a new member');
    await p.fill('#nt-body', 'Just joined! Watching Impact of Eden every Saturday night.');
    await p.click('button:has-text("Post Topic")');
    await p.waitForURL(/\/forum\/thread\/m-/);
    await p.getByText('Hello from a new member').first().waitFor();
  });
  await step('favorite character', async () => {
    await p.goto(BASE + '/character/4/Miyuki_Kagemitsu');
    await p.click('button:has-text("Add to Favorites")');
    await p.locator('button:has-text("Remove from Favorites")').waitFor();
  });
  await step('time travel: Oct 5 21:00 hides ep1 thread', async () => {
    await travel('2013-10-05T21:00');
    await p.goto(BASE + '/forum/thread/ioe-ep1');
    await p.getByText('This topic does not exist yet').waitFor();
  });
  await step('time travel: Oct 5 21:00 anime is Not yet aired', async () => {
    await p.goto(BASE + '/anime/19815/Impact_of_Eden');
    await p.getByText('Not yet aired').first().waitFor();
    const html = await p.content();
    if (html.includes('8.51')) throw new Error('score leaked before capture');
    if (html.includes('Human x Inhuman')) throw new Error('OP leaked before ep1');
  });
  await step('time travel: Oct 6 03:00 ep1 thread partial', async () => {
    await travel('2013-10-06T03:00');
    await p.goto(BASE + '/forum/thread/ioe-ep1');
    await p.getByText('Page 1 of 1').first().waitFor();
    const n = await p.locator('.post').count();
    if (n < 5 || n > 20) throw new Error('unexpected post count ' + n);
    const html = await p.content();
    if (html.includes('42,806')) throw new Error('views snapshot leaked');
  });
  await step('time travel: Oct 12 Sora bio excludes ep2 fact', async () => {
    await travel('2013-10-12T12:00');
    await p.goto(BASE + '/character/1/Sora_Gauthier');
    const html = await p.content();
    if (html.includes('bloody nose')) throw new Error('ep2 fact leaked');
    await p.getByText('More is revealed').waitFor();
  });
  await step('time travel: Oct 13 ep2 visible, ep3 hidden', async () => {
    await travel('2013-10-13T12:00');
    await p.goto(BASE + '/forum/thread/ioe-ep2');
    await p.getByText('FRONTIER RISK MANAGEMENT: Introduction').first().waitFor();
    await p.goto(BASE + '/forum/thread/ioe-ep3');
    await p.getByText('This topic does not exist yet').waitFor();
  });
  await step('member account hidden before join date', async () => {
    await p.goto(BASE + '/profile/' + user);
    await p.getByText("hasn't joined yet").waitFor();
  });
  await step('cannot post before join date', async () => {
    await p.goto(BASE + '/forum/thread/ioe-ep2');
    await p.locator('#reply-body').fill('hello from the past');
    await p.click('button:has-text("Post Reply")');
    await p.getByText('Travel to a date after that').waitFor();
  });
  await step('Jan 2012: IoE not in database', async () => {
    await travel('2012-01-05T12:00');
    await p.goto(BASE + '/anime/19815/Impact_of_Eden');
    await p.getByText('not in the database yet').waitFor();
    await p.goto(BASE + '/anime/season/2011/summer');
    await p.getByText('Sinful Apex').first().waitFor();
  });
  await step('logout', async () => {
    await travel('2013-10-24T12:00');
    await p.goto(BASE + '/');
    await p.click('button:has-text("Logout")');
    await p.locator('.userlinks a:has-text("Login")').waitFor();
  });
  await step('login again', async () => {
    await p.goto(BASE + '/login');
    await p.fill('#login', user);
    await p.fill('#password', 'hunter2hunter2');
    await p.click('form button:has-text("Login")');
    await p.waitForURL(/\/profile\//);
    await p.getByText('Recent Activity').waitFor();
  });
  const failed = process.exitCode === 1;
  console.log('Console errors:', errors.length ? '\n' + [...new Set(errors)].join('\n') : 'none');
  if (failed) console.log('Some steps failed.');
  await b.close();
})();
