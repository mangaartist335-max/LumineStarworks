// Deployment settings read from the environment.

import { test } from "node:test";
import assert from "node:assert/strict";
import { embedOrigins } from "../lib/env";

test("embed origins: defaults, lists, blanks and pasted trailing slashes", () => {
  const before = process.env.NEXT_PUBLIC_YAL_EMBED_ORIGINS;
  try {
    delete process.env.NEXT_PUBLIC_YAL_EMBED_ORIGINS;
    assert.deepEqual(embedOrigins(), ["http://localhost:3000", "http://127.0.0.1:3000"]);
    process.env.NEXT_PUBLIC_YAL_EMBED_ORIGINS = "  ";
    assert.deepEqual(embedOrigins(), ["http://localhost:3000", "http://127.0.0.1:3000"], "a blank value keeps the local defaults");
    process.env.NEXT_PUBLIC_YAL_EMBED_ORIGINS = "https://connected-era.vercel.app/, https://desktop.example.com";
    assert.deepEqual(embedOrigins(), ["https://connected-era.vercel.app", "https://desktop.example.com"]);
    process.env.NEXT_PUBLIC_YAL_EMBED_ORIGINS = "https://ok.example.com, https://bad.example.com/some/page, not a url";
    assert.deepEqual(embedOrigins(), ["https://ok.example.com"], "paths and junk are ignored");
  } finally {
    if (before === undefined) delete process.env.NEXT_PUBLIC_YAL_EMBED_ORIGINS;
    else process.env.NEXT_PUBLIC_YAL_EMBED_ORIGINS = before;
  }
});
