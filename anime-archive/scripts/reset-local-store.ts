// Removes the local development store so the archive starts fresh from the seed data.
//
//   npm run archive:reset-local

import { rmSync, existsSync } from "node:fs";
import { localStorePath } from "../lib/archive/store/local";

const file = localStorePath();
if (existsSync(file)) {
  rmSync(file);
  console.log(`Removed ${file}. The archive will load fresh seed data on the next request.`);
} else {
  console.log("No local edits found — the archive is already using the seed data.");
}
