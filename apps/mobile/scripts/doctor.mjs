#!/usr/bin/env node
// BuildBrief setup check. Runs before `npm start` / `npm run tunnel` and from
// start-buildbrief.cmd. It explains problems in plain words and, with
// --fix, repairs what it safely can (a clean `npm ci`, a starter .env).
//
//   node scripts/doctor.mjs          check only
//   node scripts/doctor.mjs --fix    check and repair

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_SDK = 58;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fix = process.argv.includes("--fix");
const isWindows = process.platform === "win32";

let failed = false;
const ok = (msg) => console.log(`  ✅ ${msg}`);
const bad = (msg, ...help) => {
  failed = true;
  console.log(`  ❌ ${msg}`);
  for (const line of help) console.log(`     ${line}`);
};
const warn = (msg, ...help) => {
  console.log(`  ⚠️  ${msg}`);
  for (const line of help) console.log(`     ${line}`);
};
const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

console.log("\nBuildBrief setup check\n");

// 1. Node.js version (matches Expo SDK 58 / React Native 0.88 requirements).
{
  const [major, minor] = process.versions.node.split(".").map(Number);
  const supported = (major === 22 && minor >= 13) || (major === 24 && minor >= 3) || major >= 26;
  if (supported) ok(`Node.js ${process.versions.node}`);
  else bad(`Node.js ${process.versions.node} is too old or unsupported.`, "Install the LTS version from https://nodejs.org, then try again.");
}

// 2. package.json still targets the right Expo SDK.
const pkg = readJson(path.join(root, "package.json"));
const expoRange = pkg?.dependencies?.expo ?? "";
const pkgIntact = new RegExp(`^[~^]?${EXPECTED_SDK}\\.`).test(expoRange);
if (pkgIntact) {
  ok(`package.json uses Expo SDK ${EXPECTED_SDK}`);
} else {
  bad(
    `package.json was changed to Expo "${expoRange || "missing"}" (this app needs SDK ${EXPECTED_SDK}).`,
    "This usually happens after running `npm audit fix --force`, which downgrades Expo.",
    "Fix: download a fresh copy of the project from GitHub, copy your .env into apps/mobile,",
    "and start again. Never run `npm audit fix --force` in this folder."
  );
}

// 3. Installed packages match the lockfile.
function installedHealthy() {
  const expo = readJson(path.join(root, "node_modules", "expo", "package.json"));
  const expoMetro = readJson(path.join(root, "node_modules", "@expo", "metro", "package.json"));
  const ngrok = readJson(path.join(root, "node_modules", "@expo", "ngrok", "package.json"));
  const problems = [];
  if (!expo) problems.push("Expo isn't installed");
  else if (!expo.version.startsWith(`${EXPECTED_SDK}.`)) problems.push(`Expo ${expo.version} is installed instead of SDK ${EXPECTED_SDK}`);
  if (!expoMetro) problems.push("@expo/metro is missing");
  if (!ngrok) problems.push("the tunnel tool (@expo/ngrok) is missing");
  return { problems, expoVersion: expo?.version };
}

if (pkgIntact) {
  let state = installedHealthy();
  if (state.problems.length && fix) {
    console.log(`  🔧 Installing packages (${state.problems.join(", ")}). First time takes a few minutes…\n`);
    fs.rmSync(path.join(root, "node_modules"), { recursive: true, force: true });
    const result = spawnSync(isWindows ? "npm.cmd" : "npm", ["ci", "--no-audit", "--no-fund"], {
      cwd: root,
      stdio: "inherit",
      shell: isWindows,
    });
    console.log("");
    if (result.status !== 0) {
      bad("Installing packages failed (see the messages above).", "Check your internet connection and try again.");
    }
    state = installedHealthy();
  }
  if (state.problems.length) {
    bad(`Packages need installing: ${state.problems.join(", ")}.`, "Fix: run `npm ci` in this folder (or double-click start-buildbrief.cmd).");
  } else {
    ok(`Packages installed (Expo ${state.expoVersion})`);
  }
}

// 4. .env with the public Supabase + API settings.
{
  const envPath = path.join(root, ".env");
  const examplePath = path.join(root, ".env.example");
  if (!fs.existsSync(envPath) && fix && fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log("  🔧 Created .env from .env.example. Fill in your Supabase URL and publishable key.");
    if (isWindows) spawnSync("notepad.exe", [envPath], { detached: true, stdio: "ignore" });
  }
  if (!fs.existsSync(envPath)) {
    bad(".env file is missing.", "Copy .env.example to .env and fill in your Supabase URL and publishable key.");
  } else {
    const env = Object.fromEntries(
      fs
        .readFileSync(envPath, "utf8")
        .replace(/^﻿/, "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const i = line.indexOf("=");
          return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
        })
    );
    const url = env.EXPO_PUBLIC_SUPABASE_URL ?? "";
    const key = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    const api = env.EXPO_PUBLIC_API_BASE_URL ?? "";
    const problems = [];
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) || url.includes("your-project-ref")) problems.push("EXPO_PUBLIC_SUPABASE_URL should look like https://abcd1234.supabase.co");
    if (!key || /your-publishable|PASTE_KEY_HERE/i.test(key) || key.includes(" ")) problems.push("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing (paste the publishable key from Supabase > Project Settings > API Keys)");
    if (/^sb_secret_/i.test(key) || key.includes("service_role")) problems.push("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is a SECRET key. Use the publishable key instead, and never put secret keys in the app");
    if (!/^https:\/\//i.test(api)) problems.push("EXPO_PUBLIC_API_BASE_URL should be your website, e.g. https://buildbrief-beta.vercel.app");
    if (problems.length) bad(".env needs attention:", ...problems.map((p) => `- ${p}`));
    else ok(".env looks good");
  }
}

// 5. Common Windows gotcha: the file saved as ".env.txt".
if (fs.existsSync(path.join(root, ".env.txt"))) {
  warn('Found ".env.txt". Windows may have added .txt; the file must be named exactly ".env".');
}

console.log("");
if (failed) {
  console.log("Fix the ❌ items above, then try again.\n");
  process.exit(1);
}
console.log("All good! Starting BuildBrief…\n");
