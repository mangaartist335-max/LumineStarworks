// Corkboard: the town's classifieds. Listings from around town, each on its
// posting date; sold, claimed and finished ones stay visible as archived.
// Corkboard never handles payments: people sort that out in person.

import { HOST } from "@/lib/web/hosts";

export const CORKBOARD_HOST = HOST.cork;

export const CATEGORIES = ["For sale", "Free", "Wanted", "Swap", "Services", "Events"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface ArchiveListing {
  id: string;
  seller: string;
  title: string;
  category: Category;
  price?: string;
  description: string;
  at: string;
  /** Sold or claimed from this moment. */
  doneAt?: string;
  /** Events finish when they're over. */
  endsAt?: string;
}

export const archiveListings: ArchiveListing[] = [
  { id: "ls_kids_bike", seller: "maple_mom", title: "Kids' bike, blue, great condition", category: "For sale", price: "$25", description: "Fits ages 6 to 9. Training wheels included if you want them. My son has moved up to a bigger bike and this one deserves another summer!", at: "2012-07-14T15:00:00Z", doneAt: "2012-07-19T18:00:00Z" },
  { id: "ls_boxes", seller: "new_neighbour", title: "Free moving boxes (about 20)", category: "Free", description: "We just moved in on Elm Street and have a mountain of flattened boxes. All yours! Leave a message and pick them up from the porch.", at: "2012-07-25T13:00:00Z", doneAt: "2012-07-27T10:00:00Z" },
  { id: "ls_gameboy", seller: "retro_ricky", title: "Wanted: old handheld games", category: "Wanted", description: "Collector looking for old handheld cartridges, any condition. Happy to trade from my doubles pile too.", at: "2012-08-02T20:00:00Z" },
  { id: "ls_piano_lessons", seller: "akira_keys", title: "Piano lessons for beginners", category: "Services", price: "$15 a lesson", description: "Patient teacher, all ages welcome. We'll learn a song you actually like in the first lesson. Weekday afternoons and Saturdays.", at: "2012-08-20T16:00:00Z" },
  { id: "ls_garage_sale", seller: "maple_mom", title: "Garage sale this Saturday, 8 to noon", category: "Events", description: "Toys, books, a slightly wobbly bookshelf and a very good waffle maker. Lemonade stand run by the kids. 14 Maple Avenue.", at: "2012-09-12T14:00:00Z", endsAt: "2012-09-15T16:00:00Z" },
  { id: "ls_paperbacks", seller: "bookworm_june", title: "Swap: sci-fi paperbacks for mysteries", category: "Swap", description: "About thirty sci-fi paperbacks, well loved. I've gone mystery-crazy and would love to swap a few at a time.", at: "2012-10-03T17:00:00Z" },
  { id: "ls_dragon_costume", seller: "maple_mom", title: "Dragon costume, ages 8 to 10", category: "For sale", price: "$10", description: "Green with a floppy tail and little wings. Worn once to great acclaim.", at: "2012-10-10T15:00:00Z", doneAt: "2012-10-21T19:00:00Z" },
  { id: "ls_snow_shovelling", seller: "skyblue_kid", title: "Snow shovelling, weekends", category: "Services", price: "$10 a driveway", description: "Saving up for a new game. I'm fast and I do the path to your door too. Saturdays and Sundays after a snowfall.", at: "2012-12-08T15:00:00Z" },
  { id: "ls_firewood", seller: "grandpa_bill", title: "Free: firewood offcuts", category: "Free", description: "A trailer's worth of dry offcuts from the workshop. Bring a bag or a wheelbarrow.", at: "2013-01-12T14:00:00Z", doneAt: "2013-01-15T12:00:00Z" },
  { id: "ls_ukulele", seller: "ukulele_dad", title: "Wanted: someone to teach me the ukulele", category: "Wanted", description: "Bought a ukulele as a new year's hobby. I can play exactly one chord. Patient teacher wanted, will pay in lessons money and home-made cookies.", at: "2013-02-05T19:00:00Z" },
  { id: "ls_bake_sale", seller: "pta_volunteers", title: "Bake sale for the school library", category: "Events", description: "Saturday in the school gym, 10 till 2. Every cupcake buys a new book for the library!", at: "2013-04-10T14:00:00Z", endsAt: "2013-04-13T18:00:00Z" },
  { id: "ls_red_kite", seller: "dana_doodles", title: "Red kite, flies great", category: "For sale", price: "$5", description: "This is the red kite from my summer album on SnapNest! I got a bigger one, so this one needs a new sky.", at: "2013-05-18T16:00:00Z", doneAt: "2013-05-20T17:00:00Z" },
  { id: "ls_babysitting", seller: "responsible_rae", title: "Babysitting, first aid course done", category: "Services", price: "$8 an hour", description: "16, love kids, finished the first aid course at the community centre. Board games, bedtime stories and homework help.", at: "2013-06-02T15:00:00Z" },
  { id: "ls_courier_map", seller: "pixelpilot", title: "Free: hand-drawn Star Courier level maps", category: "Free", description: "I drew a map of every Star Courier level with the safe lanes marked. Happy to send copies to anyone stuck!", at: "2013-08-20T18:00:00Z" },
  { id: "ls_pumpkin_seeds", seller: "grandpa_bill", title: "Seeds from our first-place pumpkin", category: "Free", description: "Saved the seeds from last year's harvest fair winner. Little envelopes, free to good gardens.", at: "2013-09-21T14:00:00Z" },
  { id: "ls_craft_fair", seller: "community_centre", title: "Holiday craft fair at the community centre", category: "Events", description: "Handmade gifts, hot chocolate and a visit from a very jolly guest. Every weekend until December 7.", at: "2013-11-20T14:00:00Z", endsAt: "2013-12-07T22:00:00Z" },
];
