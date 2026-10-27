// Delete the local demonstration store (accounts, lists, replies, reviews).
//
//   npm run yal:reset-local

import { rmSync, existsSync } from "node:fs";
import path from "node:path";

const dir = process.env.YAL_DATA_DIR || path.join(process.cwd(), ".data");
const file = path.join(dir, "yal.local.json");
if (existsSync(file)) {
  rmSync(file);
  console.log(`Removed ${file}. The archive is back to its seeded state.`);
} else {
  console.log(`Nothing to reset: ${file} does not exist.`);
}
