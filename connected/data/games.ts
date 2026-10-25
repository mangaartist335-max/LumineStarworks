// Games available on the Connected PC. Each is an original game built into
// the project; "released" is when it came out in the Connected Era, and the
// launcher only offers a game from then on.

import type { Availability } from "@/lib/availability";

export interface GameInfo {
  id: string;
  title: string;
  developer: string;
  genre: string;
  description: string;
  availability: Availability;
  /** The program that runs it. */
  appId: string;
  /** Comes with every Connected PC (no install needed). */
  builtIn?: boolean;
  achievements: { id: string; title: string; description: string }[];
}

export const games: GameInfo[] = [
  {
    id: "game_star_courier",
    title: "Star Courier",
    developer: "Tinybolt Games",
    genre: "Arcade",
    description: "Fly parcels across an asteroid field. Dodge the rocks, grab every package and survive the boss on level 4.",
    availability: { publishedAt: "2012-11-20T15:00:00Z", region: "global" },
    appId: "starcourier",
    achievements: [
      { id: "first_parcel", title: "Signed, Sealed, Delivered", description: "Collect your first parcel." },
      { id: "level_2", title: "Getting the Hang of It", description: "Reach level 2." },
      { id: "level_4", title: "Boss Fight", description: "Reach the level 4 boss." },
      { id: "score_5000", title: "Express Shipping", description: "Score 5,000 points in one run." },
      { id: "victory", title: "Mission Complete", description: "Defeat the boss." },
    ],
  },
  {
    id: "game_field_sweeper",
    title: "Field Sweeper",
    developer: "Connected Games",
    genre: "Puzzle",
    description: "Clear the field without stepping on a hidden thistle. Numbers tell you how many thistles touch each square.",
    availability: { publishedAt: "2009-10-22T12:00:00Z", region: "global" },
    appId: "fieldsweeper",
    builtIn: true,
    achievements: [
      { id: "first_win", title: "Clean Sweep", description: "Win a game." },
      { id: "fast_win", title: "Speed Sweeper", description: "Win in under 60 seconds." },
      { id: "expert_win", title: "Thistle Whisperer", description: "Win on Expert." },
    ],
  },
];

export const gameById = (id: string) => games.find((g) => g.id === id);
