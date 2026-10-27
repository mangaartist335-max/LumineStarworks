// SnapNest's starting albums: snapshots people around town shared. The
// pictures are original drawings made for them (scripts/media/snapshots.py).
// Albums and photos appear on their upload dates.

import { HOST } from "@/lib/web/hosts";
import { mediaUrl } from "./media";

export const SNAPNEST_HOST = HOST.snap;

export interface ArchivePhoto {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url: string;
  at: string;
}

export interface ArchiveAlbum {
  id: string;
  owner: string;
  title: string;
  description: string;
  createdAt: string;
  photos: ArchivePhoto[];
}

const snap = (key: string) => mediaUrl(`snapshot:${key}`);

export const archiveAlbums: ArchiveAlbum[] = [
  {
    id: "alb_dana_summer",
    owner: "dana_doodles",
    title: "Summer 2012",
    description: "Picnics, kites and the Saturday market. Best summer ever!",
    createdAt: "2012-07-22T19:00:00Z",
    photos: [
      { id: "ph_picnic", title: "Picnic in the park", description: "Strawberries, lemonade and a very windy blanket.", tags: ["picnic", "park", "summer"], url: snap("picnic-park"), at: "2012-07-22T19:00:00Z" },
      { id: "ph_kites", title: "Kite day", description: "Three kites up at once! The red one is mine.", tags: ["kites", "park", "summer"], url: snap("kite-day"), at: "2012-08-11T20:00:00Z" },
      { id: "ph_market", title: "Saturday farmers' market", description: "The honey stand sold out by ten again.", tags: ["farmers market", "summer", "town"], url: snap("farmers-market"), at: "2012-08-18T17:00:00Z" },
    ],
  },
  {
    id: "alb_bill_fair",
    owner: "grandpa_bill",
    title: "Harvest fair 2012",
    description: "Our pumpkin won first place! Thirty years of trying, and we finally did it.",
    createdAt: "2012-10-06T21:00:00Z",
    photos: [{ id: "ph_pumpkin", title: "First place!", description: "Grandma says it's because she talks to it every morning.", tags: ["harvest fair", "pumpkin", "autumn"], url: snap("harvest-pumpkin"), at: "2012-10-06T21:00:00Z" }],
  },
  {
    id: "alb_sky_snow",
    owner: "skyblue_kid",
    title: "Snow days",
    description: "Winter 2013. The snowman on Birch Street is famous now lol",
    createdAt: "2013-01-19T18:00:00Z",
    photos: [
      { id: "ph_snowman", title: "The tuxedo snowman", description: "Even the radio talked about him!", tags: ["snow", "snowman", "winter"], url: snap("tuxedo-snowman"), at: "2013-01-19T18:00:00Z" },
      { id: "ph_rink", title: "Free skate at the rink", description: "Fell over twice, got back up twice. Counts as a win.", tags: ["ice skating", "winter"], url: snap("ice-rink"), at: "2013-02-02T21:00:00Z" },
    ],
  },
];
