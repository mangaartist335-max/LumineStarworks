// Exports the local archive (seed + any local edits) as a structured JSON document.
//
//   npm run archive:export -- ./my-export.json

import { writeFileSync } from "node:fs";
import { exportArchive } from "../lib/archive/import-export";
import { loadLocalTables } from "../lib/archive/store/local";

const target = process.argv[2] ?? "archive-export.json";
const tables = await loadLocalTables();
writeFileSync(target, JSON.stringify(exportArchive(tables), null, 2), "utf8");
console.log(`Exported ${tables.productions.length} productions to ${target}.`);
