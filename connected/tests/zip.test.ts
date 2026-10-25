import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { crc32, readZip, writeZip } from "../lib/zip";

test("crc32 matches the standard check value", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")).toString(16), "cbf43926");
});

test("zip: write, then read back stored and deflated entries", async () => {
  const text = new TextEncoder().encode("Summer plans 2013\n".repeat(50));
  const random = crypto.getRandomValues(new Uint8Array(300)); // won't compress: stored
  const zip = await writeZip([
    { name: "notes/summer.txt", data: text },
    { name: "noise.bin", data: random },
  ]);
  const entries = readZip(zip);
  assert.deepEqual(entries.map((e) => e.name), ["notes/summer.txt", "noise.bin"]);
  assert.equal(entries[0].method, 8);
  assert.equal(entries[1].method, 0);
  assert.deepEqual(await entries[0].read(), text);
  assert.deepEqual(await entries[1].read(), random);
});

test("zip: archives open in the system unzip tool, and its archives open here", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "zip-test-"));
  const ours = path.join(dir, "ours.zip");
  writeFileSync(ours, await writeZip([{ name: "hello.txt", data: new TextEncoder().encode("hello from 2013") }]));
  try {
    assert.equal(execFileSync("unzip", ["-p", ours, "hello.txt"]).toString(), "hello from 2013");
    const theirs = path.join(dir, "theirs.zip");
    writeFileSync(path.join(dir, "a.txt"), "made by the zip command ".repeat(20));
    execFileSync("zip", ["-q", "-j", theirs, path.join(dir, "a.txt")]);
    const entries = readZip(new Uint8Array(readFileSync(theirs)));
    assert.equal(new TextDecoder().decode(await entries[0].read()), "made by the zip command ".repeat(20));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return; // zip tools not installed
    throw e;
  }
});

test("zip: rejects files that aren't archives", () => {
  assert.throws(() => readZip(new TextEncoder().encode("not a zip at all, sorry")), /isn't a ZIP/);
});
