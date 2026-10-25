// Copies PDF.js's worker next to the app so the PDF Reader can load it
// from the same origin. Runs after `npm install`.

import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(join(root, "public"), { recursive: true });
copyFileSync(join(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs"), join(root, "public/pdf.worker.min.mjs"));
console.log("Copied pdf.worker.min.mjs to public/");
