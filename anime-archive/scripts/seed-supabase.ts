// Loads the seed archive into a Supabase project using the service role key.
// Existing rows with the same ids are left alone, so it's safe to run twice.
//
//   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run db:seed

import { createClient } from "@supabase/supabase-js";
import { buildSeedTables } from "../data/seed";
import { TABLE_ORDER } from "../lib/archive/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first (see .env.example).");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const tables = buildSeedTables();

for (const table of TABLE_ORDER) {
  const rows = tables[table] as { id: string }[];
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + 500), { onConflict: "id", ignoreDuplicates: true });
    if (error) {
      console.error(`Couldn't seed ${table}: ${error.message}`);
      process.exit(1);
    }
  }
  if (rows.length) console.log(`✓ ${table}: ${rows.length}`);
}
console.log("Seed data is in place. Have a lovely time exploring the archive!");
