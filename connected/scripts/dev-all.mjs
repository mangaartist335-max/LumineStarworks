// Starts both servers the Connected Era needs: YourAnimeList (its own
// Next.js app, shown inside the desktop's browser) on port 3100 and the
// Connected desktop on port 3000. Ctrl+C stops both.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const connected = join(here, "..");
const yal = join(connected, "..", "yal");
const YAL_PORT = process.env.YAL_PORT ?? "3100";
const PORT = process.env.PORT ?? "3000";

const servers = [
  { name: "yal", cwd: yal, args: ["run", "dev", "--", "-p", YAL_PORT], color: 35 },
  { name: "connected", cwd: connected, args: ["run", "dev", "--", "-p", PORT], color: 36 },
];

for (const s of servers) {
  if (!existsSync(join(s.cwd, "node_modules"))) {
    console.error(`${s.name}: dependencies missing. Run "npm install" in ${s.cwd} first.`);
    process.exit(1);
  }
}

const children = servers.map((s) => {
  const child = spawn("npm", s.args, {
    cwd: s.cwd,
    env: {
      ...process.env,
      // YAL may be framed by the desktop; the desktop finds YAL here.
      NEXT_PUBLIC_YAL_EMBED_ORIGINS: process.env.NEXT_PUBLIC_YAL_EMBED_ORIGINS ?? `http://localhost:${PORT},http://127.0.0.1:${PORT}`,
      NEXT_PUBLIC_YAL_ORIGIN: process.env.NEXT_PUBLIC_YAL_ORIGIN ?? `http://localhost:${YAL_PORT}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const prefix = `\x1b[${s.color}m[${s.name}]\x1b[0m `;
  const relay = (stream, out) => {
    let buf = "";
    stream.on("data", (chunk) => {
      buf += chunk;
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) out.write(prefix + line + "\n");
    });
  };
  relay(child.stdout, process.stdout);
  relay(child.stderr, process.stderr);
  child.on("exit", (code) => {
    console.log(`${prefix}stopped${code ? ` (exit ${code})` : ""}`);
    shutdown(code ?? 0);
  });
  return child;
});

let stopping = false;
function shutdown(code) {
  if (stopping) return;
  stopping = true;
  for (const c of children) if (c.exitCode === null) c.kill("SIGTERM");
  setTimeout(() => process.exit(code), 500);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log(`Connected Era: desktop on http://localhost:${PORT}  ·  YourAnimeList on http://localhost:${YAL_PORT}`);
