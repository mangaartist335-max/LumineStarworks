// Postgres / PostgREST codes for "that column doesn't exist" — what you get
// when the code is newer than the database (a migration hasn't been run yet).
const MISSING_COLUMN_CODES = new Set(["42703", "PGRST204"]);

export const MISSING_MIGRATION_MESSAGE =
  "The database is missing a setup step. Run supabase/migrations/0003_generation_status.sql in the Supabase SQL Editor, then try again.";

export const MISSING_APP_MIGRATION_MESSAGE =
  "The database is missing a setup step. Run supabase/migrations/0004_app_builds.sql in the Supabase SQL Editor, then try again.";

export function isMissingColumnError(error: { code?: string } | null): boolean {
  return !!error?.code && MISSING_COLUMN_CODES.has(error.code);
}
