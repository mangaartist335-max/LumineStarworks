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
  // Pages this script expects to 404 (held-back future-phase material).
  const expected404 = ['/anime/19815/Impact_of_Eden', '/forum/thread/ioe-ep1'];
  p.on('console', m => { if (m.type() === 'error' && !(m.text().includes('404') && expected404.some(u => p.url().endsWith(u)))) errors.push('console ' + p.url() + ' ' + (m.text().includes('hydrated') ? m.text().slice(0, 5000) : m.text().slice(0, 300))); });
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
  await step('Impact of Eden is held back (future phase)', async () => {
    const r = await p.goto(BASE + '/anime/19815/Impact_of_Eden');
    if (r.status() !== 404) throw new Error('expected 404, got ' + r.status());
    await p.goto(BASE + '/forum/thread/ioe-ep1');
    await p.getByText('Page not found').first().waitFor();
    await p.goto(BASE + '/search?q=Impact+of+Eden');
    if ((await p.content()).includes('Sora Gauthier')) throw new Error('search leaked a held-back character');
  });
  await step('add to list', async () => {
    await p.goto(BASE + '/anime/10380/Sinful_Apex');
    await p.click('button:has-text("Add to My List")');
    await p.getByText('On your list:').waitFor();
  });
  await step('edit list entry', async () => {
    await p.goto(BASE + '/ownlist/anime/10380/edit');
    await p.fill('#le-eps', '3');
    await p.selectOption('#le-score', '9');
    await p.fill('#le-notes', 'Rewatching before the Blu-ray!');
    await p.click('button:has-text("Update")');
    await p.waitForURL(/\/animelist\//);
    await p.getByText('Your list has been updated').waitFor();
    await p.getByText('3/24').waitFor();
  });
  await step('spoiler toggle', async () => {
    await p.goto(BASE + '/forum/thread/t-21990');
    const sp = p.locator('#p4 .spoiler');
    await sp.locator('button.spoiler-toggle').click();
    await sp.locator('.spoiler-body').getByText("Lyle's face").waitFor({ state: 'visible' });
  });
  await step('sort newest first', async () => {
    await p.goto(BASE + '/forum/thread/t-21990');
    await p.selectOption('#sort', 'newest');
    await p.waitForURL(/sort=newest/);
    const first = await p.locator('.post').first().getAttribute('id');
    if (first !== 'p6') throw new Error('newest post should come first, got ' + first);
  });
  await step('pagination', async () => {
    await p.goto(BASE + '/forum/thread/t-21990');
    await p.getByText('Page 1 of 1').first().waitFor();
  });
  await step('quote + reply', async () => {
    await p.goto(BASE + '/forum/thread/t-21990');
    await p.locator('#p2 .post-actions a:has-text("Quote")').click();
    await p.waitForURL(/quote=2/);
    const ta = p.locator('#reply-body');
    await ta.waitFor();
    const v = await ta.inputValue();
    if (!v.startsWith('[quote=ShounenLifer_VHS;2]')) throw new Error('quote not prefilled: ' + v.slice(0, 80));
    await ta.fill(v + 'That final climb was perfect, and [b]Moonbirth[/b] over the credits! [spoiler=tiny]hi[/spoiler]');
    await p.click('button:has-text("Post Reply")');
    await p.waitForURL(/page=last/);
    await p.getByText('[YOUR REPLY]').waitFor();
    await p.locator('.post.user-reply .quote-head:has-text("ShounenLifer_VHS")').waitFor();
  });
  await step('follow topic', async () => {
    await p.goto(BASE + '/forum/thread/t-28655');
    await p.click('button:has-text("Follow Topic")');
    await p.locator('button:has-text("Unfollow Topic")').waitFor();
    await p.goto(BASE + '/forum/following');
    await p.getByText('Vacant Crown: Liminal War Episode 24 Discussion').first().waitFor();
  });
  await step('report post', async () => {
    await p.goto(BASE + '/forum/thread/t-21990');
    await p.locator('#p3 .post-actions a.report').click();
    await p.fill('#report-reason', 'Finale spoiler outside spoiler tags');
    await p.click('button:has-text("Send Report")');
    await p.getByText('Your report was sent').waitFor();
  });
  await step('write review', async () => {
    await p.goto(BASE + '/anime/7741/Zero_Latitude/reviews');
    await p.fill('#rv-eps', '3');
    await p.fill('#rv-body', 'Three episodes in and the time skips already have me hooked on this mystery. '.repeat(4));
    await p.click('button:has-text("Submit Review")');
    await p.waitForURL(/reviews#review-/);
    await p.getByRole('link', { name: user, exact: true }).first().waitFor();
  });
  await step('new topic', async () => {
    await p.goto(BASE + '/forum/new?board=general');
    await p.fill('#nt-title', 'Hello from a new member');
    await p.fill('#nt-body', 'Just joined! Catching up on Iron to Requiem this weekend.');
    await p.click('button:has-text("Post Topic")');
    await p.waitForURL(/\/forum\/thread\/m-/);
    await p.getByText('Hello from a new member').first().waitFor();
  });
  await step('favorite character', async () => {
    await p.goto(BASE + '/character/124/Nico_Vale');
    await p.click('button:has-text("Add to Favorites")');
    await p.locator('button:has-text("Remove from Favorites")').waitFor();
  });
  await step('time travel: Jan 24 01:00 JST hides the Sinful Apex finale thread', async () => {
    await travel('2012-01-24T01:00');
    await p.goto(BASE + '/forum/thread/t-21990');
    await p.getByText('This topic does not exist yet').waitFor();
  });
  await step('time travel: Jan 5, 2012 Glass Cathedral is Not yet aired', async () => {
    await travel('2012-01-05T12:00');
    await p.goto(BASE + '/anime/4407/Glass_Cathedral');
    await p.getByText('Not yet aired').first().waitFor();
    const html = await p.content();
    if (html.includes('7.71')) throw new Error('score leaked before capture');
    if (html.includes('Stained Memory')) throw new Error('OP leaked before premiere');
  });
  await step('time travel: Jan 24 03:00 JST finale thread shows only its first 3 posts', async () => {
    await travel('2012-01-24T03:00');
    await p.goto(BASE + '/forum/thread/t-21990');
    const n = await p.locator('.post').count();
    if (n !== 3) throw new Error('expected the 3 posts made by 03:00 JST, got ' + n);
  });
  await step('time travel: Jan 10, 2012 Nico bio holds back the episode 23 reveal', async () => {
    await travel('2012-01-10T12:00');
    await p.goto(BASE + '/character/124/Nico_Vale');
    const html = await p.content();
    if (html.includes('Chooses what the wish will be')) throw new Error('episode 23 fact leaked');
    await p.getByText('More is revealed').waitFor();
  });
  await step('time travel: Dec 15, 2012 Vacant Crown finale thread opens at 17:31 JST', async () => {
    await travel('2012-12-15T17:00');
    await p.goto(BASE + '/forum/thread/t-28655');
    await p.getByText('This topic does not exist yet').waitFor();
    await travel('2012-12-15T18:00');
    await p.goto(BASE + '/forum/thread/t-28655');
    await p.getByText('Vacant No More').first().waitFor();
  });
  await step('member account hidden before join date', async () => {
    await p.goto(BASE + '/profile/' + user);
    await p.getByText("hasn't joined yet").waitFor();
  });
  await step('cannot post before join date', async () => {
    await p.goto(BASE + '/forum/thread/t-28655');
    await p.locator('#reply-body').fill('hello from the past');
    await p.click('button:has-text("Post Reply")');
    await p.getByText('Travel to a date after that').waitFor();
  });
  await step('Jan 2012: Iron to Requiem not in database yet', async () => {
    await travel('2012-01-05T12:00');
    await p.goto(BASE + '/anime/16592/Iron_to_Requiem');
    await p.getByText('not in the database yet').waitFor();
    await p.goto(BASE + '/anime/season/2011/summer');
    await p.locator('#content').getByRole('link', { name: 'Sinful Apex' }).first().waitFor();
  });
  await step('embedded mode hides the archive toolbar', async () => {
    await p.goto(BASE + '/?embed=1');
    if (await p.locator('.archive-bar').count()) throw new Error('toolbar still shown when embedded');
    await p.goto(BASE + '/?embed=0');
    await p.locator('.archive-bar').waitFor();
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
