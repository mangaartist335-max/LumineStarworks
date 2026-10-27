// Program logic: calculator, Field Sweeper, Paint's fill, Messenger rules
// and ConnectMail delivery.

import { test } from "node:test";
import assert from "node:assert/strict";
import { initialCalc, press, type CalcKey } from "../lib/calculator";
import { chord, flagsLeft, newBoard, reveal, seed, toggleMark } from "../lib/fieldsweeper";
import { floodFill } from "../lib/paint";
import { directId, presenceAt, scriptedReply, statusMessageAt, tokenize, accountPresence } from "../lib/messenger";
import { sampleContactById, sampleContacts } from "../data/messenger";
import { deliverArchiveMail, parseAddresses, replySubject, sendMail, COL_MAIL, type MailMessage } from "../lib/mail";
import { MemoryStore } from "../lib/storage/memory";
import { wallTimeToUtc } from "../lib/time";

const keys = (seq: string) => seq.split(" ").reduce((s, k) => press(s, k as CalcKey), initialCalc);

test("calculator does pocket-calculator arithmetic", () => {
  assert.equal(keys("1 2 + 3 0 =").display, "42");
  assert.equal(keys("2 + 3 × 4 =").display, "20"); // left to right, like Windows Standard
  assert.equal(keys("1 0 ÷ 4 =").display, "2.5");
  assert.equal(keys("5 + = =").display, "15"); // repeat last operation
  assert.equal(keys("0 . 1 + 0 . 2 =").display, "0.3");
  assert.equal(keys("5 0 + 1 0 %").display, "5");
  assert.equal(keys("9 sqrt").display, "3");
  assert.equal(keys("7 neg").display, "-7");
  assert.equal(keys("1 2 3 back").display, "12");
  assert.equal(keys("8 ÷ 0 =").error, true);
  assert.equal(keys("8 ÷ 0 = 3").display, "3");
  const m = keys("6 M+ C 4 M+ MR");
  assert.equal(m.display, "10");
});

test("Field Sweeper keeps the first click safe and counts neighbours", () => {
  let rnd = 0.42;
  const random = () => (rnd = (rnd * 9301 + 49297) % 233280 / 233280);
  const b = reveal(newBoard(9, 9, 10), 40, random);
  assert.equal(b.cells.filter((c) => c.thistle).length, 10);
  assert.equal(b.cells[40].thistle, false);
  assert.ok(b.cells[40].open);
  for (let i = 0; i < b.cells.length; i++) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if ((dr || dc) && r + dr >= 0 && r + dr < 9 && c + dc >= 0 && c + dc < 9 && b.cells[(r + dr) * 9 + c + dc].thistle) n++;
    assert.equal(b.cells[i].near, n);
  }
});

test("Field Sweeper flags, chords, wins and loses", () => {
  // A 1x3 strip: thistle in the middle is impossible to win around, so use 2x2 with one thistle.
  let b = seed(newBoard(2, 2, 1), 0, () => 0.99);
  const mine = b.cells.findIndex((c) => c.thistle);
  assert.notEqual(mine, 0);
  b = toggleMark(b, mine);
  assert.equal(flagsLeft(b), 0);
  b = reveal(b, 0);
  b = chord(b, 0);
  assert.equal(b.state, "won");
  const lost = reveal(seed(newBoard(2, 2, 1), 0, () => 0.99), mine);
  assert.equal(lost.state, "lost");
});

test("Paint's flood fill stops at edges", () => {
  const w = 4;
  const h = 3;
  const data = new Uint8ClampedArray(w * h * 4).fill(255);
  // A black wall down column 2.
  for (let y = 0; y < h; y++) data.set([0, 0, 0, 255], (y * w + 2) * 4);
  const img = { width: w, height: h, data };
  assert.equal(floodFill(img, 0, 0, [255, 0, 0, 255]), true);
  assert.deepEqual([...data.slice(0, 4)], [255, 0, 0, 255]);
  assert.deepEqual([...data.slice((1 * w + 1) * 4, (1 * w + 1) * 4 + 4)], [255, 0, 0, 255]);
  assert.deepEqual([...data.slice((0 * w + 3) * 4, (0 * w + 3) * 4 + 4)], [255, 255, 255, 255]);
  assert.equal(floodFill(img, 0, 0, [255, 0, 0, 255]), false);
});

test("Messenger: shared chat ids, presence schedules, status messages", () => {
  assert.equal(directId("usr_b", "ct_a"), directId("ct_a", "usr_b"));
  const dana = sampleContactById("ct_dana")!;
  const zone = "America/New_York";
  // Saturday 7 Sep 2013, 4pm in New York: weekend afternoon, Dana is online.
  assert.equal(presenceAt(dana, wallTimeToUtc(2013, 8, 7, 16, 0, zone), zone), "online");
  // Tuesday 3am: offline.
  assert.equal(presenceAt(dana, wallTimeToUtc(2013, 8, 10, 3, 0, zone), zone), "offline");
  // Weekday lunch: away.
  assert.equal(presenceAt(dana, wallTimeToUtc(2013, 8, 10, 12, 30, zone), zone), "away");
  assert.equal(statusMessageAt(dana, Date.parse("2012-07-05T00:00:00Z")), "picnic weather!! ☀");
  assert.equal(statusMessageAt(dana, Date.parse("2013-09-07T00:00:00Z")), "autumn sketch walks start soon 🍂");
  for (const c of sampleContacts) assert.ok(c.email.endsWith("@mail.connectedera.local"));
  assert.equal(accountPresence({ status: "busy", message: "", at: 1000 }, 1000 + 30_000), "busy");
  assert.equal(accountPresence({ status: "busy", message: "", at: 1000 }, 1000 + 200_000), "offline");
});

test("Messenger: automatic replies fit what was said", () => {
  const sky = sampleContactById("ct_sky")!;
  assert.ok(sky.links.metube.includes(scriptedReply(sky, "lol watch this http://metube.connectedera.local/watch?v=vid_mt0002", 0)));
  assert.ok(sky.greetings.includes(scriptedReply(sky, "hey!", 1)));
  assert.ok(sky.howAreYou.includes(scriptedReply(sky, "how are you doing?", 0)));
  assert.ok(sky.topics[0].replies.includes(scriptedReply(sky, "did you beat the boss in star courier", 0)));
  assert.ok(sky.smallTalk.includes(scriptedReply(sky, "I had pasta for dinner", 3)));
});

test("Messenger: emoticons and links become tokens", () => {
  const t = tokenize("hi :) see metube.connectedera.local/watch?v=vid_mt0002 <3");
  assert.deepEqual(
    t.map((x) => x.kind),
    ["text", "emoticon", "text", "link", "text", "emoticon"],
  );
  const link = t.find((x) => x.kind === "link");
  assert.equal(link && link.kind === "link" && link.url, "http://metube.connectedera.local/watch?v=vid_mt0002");
  assert.deepEqual(tokenize("http://search.connectedera.local/").map((x) => x.kind), ["link"]);
});

test("ConnectMail: addresses, subjects and archive delivery", async () => {
  assert.deepEqual(parseAddresses("Dana <dana.doodles@mail.connectedera.local>, sam@mail.connectedera.local; nope").bad, ["nope"]);
  assert.equal(parseAddresses("Dana <dana.doodles@mail.connectedera.local>").ok[0].name, "Dana");
  assert.equal(replySubject("Re: hi", "reply"), "Re: hi");
  assert.equal(replySubject("hi", "forward"), "Fw: hi");

  const store = new MemoryStore();
  const account = { id: "usr_sam", name: "Sam", email: "sam@mail.connectedera.local", createdAt: "2013-09-07T20:00:00.000Z" };
  const first = await deliverArchiveMail(store, account, Date.parse("2013-09-07T20:01:00Z"));
  assert.deepEqual(first.map((m) => m.id), ["usr_sam_mail_welcome"]);
  // Later: Dana's hello and Tom's tips arrive, and October's newsletter once its date passes.
  const later = await deliverArchiveMail(store, account, Date.parse("2013-10-06T00:00:00Z"));
  assert.ok(later.some((m) => m.id.endsWith("mail_dana_hello")));
  assert.ok(later.some((m) => m.id.endsWith("mail_metube_2013_10")));
  // Newsletters from before the account existed never arrive; nothing is delivered twice.
  assert.ok(!later.some((m) => m.id.endsWith("mail_mangashelf_2013_01")));
  assert.equal((await deliverArchiveMail(store, account, Date.parse("2013-10-06T00:00:00Z"))).length, 0);
});

test("ConnectMail: local delivery, automatic replies and bounces", async () => {
  const store = new MemoryStore();
  const sam = { id: "usr_sam", name: "Sam", email: "sam@mail.connectedera.local", createdAt: "2013-09-07T20:00:00.000Z" };
  const alex = { id: "usr_alex", name: "Alex", email: "alex@mail.connectedera.local", createdAt: "2013-09-07T20:00:00.000Z" };
  await store.putBlob("blob_pic", new Blob(["picture"]));
  const report = await sendMail(
    store,
    sam,
    [sam, alex],
    { to: [{ email: "alex@mail.connectedera.local" }, { email: "dana.doodles@mail.connectedera.local" }, { email: "someone@example.com" }], cc: [], subject: "Hello", body: "Hi!", attachments: [{ id: "att_1", name: "pic.png", mime: "image/png", size: 7, blobId: "blob_pic" }] },
    Date.parse("2013-09-07T21:00:00Z"),
  );
  assert.deepEqual(report.delivered.map((a) => a.email), ["alex@mail.connectedera.local"]);
  assert.deepEqual(report.automatic.map((a) => a.email), ["dana.doodles@mail.connectedera.local"]);
  assert.deepEqual(report.bounced.map((a) => a.email), ["someone@example.com"]);
  const all = await store.list<MailMessage>(COL_MAIL);
  const alexInbox = all.filter((m) => m.owner === "usr_alex" && m.folder === "inbox");
  assert.equal(alexInbox.length, 1);
  assert.notEqual(alexInbox[0].attachments[0].blobId, "blob_pic");
  assert.equal(await (await store.getBlob(alexInbox[0].attachments[0].blobId!))!.text(), "picture");
  const samInbox = all.filter((m) => m.owner === "usr_sam" && m.folder === "inbox");
  assert.ok(samInbox.some((m) => m.subject === "Undeliverable: Hello" && m.origin === "system"));
  assert.ok(samInbox.some((m) => m.from.email === "dana.doodles@mail.connectedera.local" && m.body.includes("Automatic reply")));
  assert.equal(all.filter((m) => m.owner === "usr_sam" && m.folder === "sent").length, 1);
});
