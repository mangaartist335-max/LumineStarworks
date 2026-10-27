// People and characters for the back catalogue, from the Connected Era
// Master Bible. Everyone else in its people registry already has a record in
// industry.ts; this file adds the one who doesn't, and the one catalogue
// character the Bible names.

import type { Character, Company, Person } from "./types";
import { SRC } from "./sources";

export const catalogueCompanies: Company[] = [];

export const cataloguePeople: Person[] = [
  {
    id: 15,
    slug: "Rento_Shibasaki",
    name: "Rento Shibasaki",
    occupations: ["Composer"],
    about: "Composer. Scored Vacant Crown: Liminal War and Steelbound Testament.",
    visibleFrom: null,
    sources: [SRC.biblePeople],
  },
];

export const catalogueCharacters: Character[] = [
  {
    id: 126,
    slug: "Aria_Moonbirth",
    name: "Aria Moonbirth",
    role: "Singer",
    visibleFrom: null,
    bio: [{ text: "A singer in Sinful Apex, played by the real-life singer LUNE.", revealedAt: null }],
    relationships: [],
    sources: [SRC.bibleFranchise, SRC.bibleMusic],
  },
];
