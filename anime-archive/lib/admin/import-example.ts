/**
 * The example shown in the importer. It is clearly hypothetical: one Proposed
 * sample production, plus a deliberately different episode count for a
 * confirmed production so editors can see how the importer protects
 * confirmed facts (it becomes a conflict instead of an overwrite).
 */
export const IMPORT_EXAMPLE = {
  format: "lumine-archive",
  version: 1,
  source: {
    title: "Example production document",
    kind: "production_document",
    received_at: "2026-10-20",
    provenance: "provisional",
    description: "Illustrates the import format. Preview it to see creates, updates and conflicts before anything is saved.",
  },
  tables: {
    productions: [
      {
        slug: "example-starlight-courier",
        title: "Example: Starlight Courier",
        format: "tv",
        premiere_year: 2027,
        premiere_season: "spring",
        premiere_date: "2027-04-03",
        finale_date: "2027-06-19",
        episode_count: 12,
        genres: ["Adventure", "Slice of Life"],
        synopsis: "A sample entry showing how a production document is imported.",
        provenance: "proposed",
      },
      { slug: "earth-metal-comet-season-2", episode_count: 24 },
    ],
    production_studios: [{ production_id: "example-starlight-courier", studio_id: "studio-hoshizora", role: "animation", provenance: "proposed" }],
    broadcast_runs: [
      {
        production_id: "example-starlight-courier",
        kind: "tv",
        label: "Japanese broadcast",
        language: "ja",
        region: "JP",
        start_date: "2027-04-03",
        end_date: "2027-06-19",
        local_time: "23:30",
        time_zone: "Asia/Tokyo",
        episode_count: 12,
        is_primary: true,
        provenance: "proposed",
      },
    ],
    production_credits: [{ production_id: "example-starlight-courier", person_id: "haruki-sendou", role: "director", provenance: "proposed" }],
  },
};
