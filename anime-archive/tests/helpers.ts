import type { BroadcastRun, Production } from "@/lib/archive/types";

const stamp = "2026-10-20T00:00:00.000Z";

export function run(overrides: Partial<BroadcastRun> = {}): BroadcastRun {
  return {
    id: "run-1",
    production_id: "prod-1",
    kind: "tv",
    label: null,
    language: "ja",
    region: "JP",
    network_id: null,
    start_date: null,
    end_date: null,
    weekday: null,
    local_time: null,
    time_zone: "Asia/Tokyo",
    cadence: "weekly",
    episode_count: null,
    skipped_dates: [],
    is_primary: true,
    notes: null,
    provenance: "confirmed",
    created_at: stamp,
    updated_at: stamp,
    ...overrides,
  };
}

export function production(overrides: Partial<Production> = {}): Production {
  return {
    id: "prod-1",
    slug: "test-production",
    franchise_id: null,
    franchise_order: null,
    season_number: null,
    title: "Test Production",
    title_native: null,
    title_romaji: null,
    alt_titles: [],
    format: "tv",
    synopsis: null,
    genres: [],
    themes: [],
    source_material: null,
    demographic: null,
    age_rating: null,
    premiere_year: null,
    premiere_season: null,
    premiere_date: null,
    finale_date: null,
    episode_count: null,
    runtime_minutes: null,
    production_history: null,
    reception: null,
    score: null,
    poster_url: null,
    notes: null,
    provenance: "confirmed",
    created_at: stamp,
    updated_at: stamp,
    ...overrides,
  };
}

export const codes = (issues: { code: string }[]) => issues.map((i) => i.code);
