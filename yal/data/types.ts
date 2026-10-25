// Shared record types for the YAL archive catalogue.
//
// Conventions:
// - Event timestamps are UTC ISO strings (`...Z`). `null` means the date is
//   not documented; such records are treated as back-catalogue.
// - `visibleFrom` is when a record first existed on YAL. Records are hidden
//   from any historical view before that moment.
// - Unknown facts stay `null`/empty and render as "N/A" or "Not documented"
//   rather than being guessed.
// - `provenance` separates documented facts from reconstructed sample
//   content so the two are never mixed up.
// - `phase` marks material held back for a later development phase
//   (see data/release.ts); it is hidden unless that phase is enabled.

import type { FuturePhase } from "./release";

export type Provenance =
  | "documented" // stated in the established Lumine StarWorks references
  | "archived" // recovered from the archived YAL pages
  | "reconstructed" // sample content written for this reconstruction
  | "derived"; // computed from other records (counts, weekdays, ...)

export type AnimeType = "TV" | "OVA" | "Movie" | "Special" | "ONA" | "Unknown";

export type RelationKind =
  | "Prequel"
  | "Sequel"
  | "Side story"
  | "Alternative version"
  | "Special"
  | "Other"
  | "Adaptation";

export interface SourceNote {
  /** Short citation shown in archive notes, e.g. "AniFanWiki (edited Oct 8, 2013)". */
  cite: string;
}

export interface Company {
  /** Held back until this development phase is enabled. */
  phase?: FuturePhase;
  id: number;
  slug: string;
  name: string;
  kinds: CompanyKind[];
  /** When the company first appears in the archive, if documented. */
  foundedNote?: string;
  about?: string;
  visibleFrom: string | null;
  sources: SourceNote[];
}

export type CompanyKind =
  | "Studio"
  | "Producer"
  | "Licensor"
  | "Distributor"
  | "Broadcaster"
  | "Streaming"
  | "Record label"
  | "Publisher";

export interface Person {
  /** Held back until this development phase is enabled. */
  phase?: FuturePhase;
  id: number;
  slug: string;
  name: string;
  /** Native-script name when documented. */
  nativeName?: string;
  occupations: string[];
  about?: string;
  visibleFrom: string | null;
  sources: SourceNote[];
}

export interface StaffCredit {
  personId: number;
  role: string;
  note?: string;
  /** When this credit became public. Defaults to the anime's visibleFrom. */
  visibleFrom?: string | null;
  source?: SourceNote;
}

export interface VoiceCredit {
  characterId: number;
  personId: number;
  language: "Japanese" | "English";
  visibleFrom?: string | null;
}

export interface ThemeSong {
  kind: "Opening" | "Ending" | "Insert";
  title: string;
  artist: string;
  episodes?: string;
  note?: string;
  visibleFrom: string | null;
}

export interface Episode {
  number: number;
  title: string | null;
  /** First regular TV airing (UTC). */
  airedAt: string | null;
  note?: string;
  /** Archive discussion thread, when one exists. */
  threadId?: string;
}

export interface Relation {
  kind: RelationKind;
  target: { type: "anime" | "manga"; id: number };
  note?: string;
  visibleFrom?: string | null;
}

export interface ScoreSnapshot {
  capturedAt: string;
  score: number;
  scoredBy: number;
  source: SourceNote;
}

export interface BroadcastInfo {
  label: string;
  at: string | null;
  note?: string;
  visibleFrom?: string | null;
}

export interface TimedText {
  text: string;
  /** When this became known. Hidden from earlier views. */
  visibleFrom: string | null;
}

export interface Anime {
  /** Held back until this development phase is enabled. */
  phase?: FuturePhase;
  id: number;
  slug: string; // e.g. "Impact_of_Eden"
  title: string;
  titleJapanese?: string;
  titleRomaji?: string;
  synonyms: string[];
  type: AnimeType;
  episodesPlanned: number | null;
  /** Earliest airing/release (UTC), or null when undocumented. */
  airedFrom: string | null;
  airedTo: string | null;
  /** Release year when only the year is documented (or derived from airedFrom). */
  year: number | null;
  /** Free-text release note when only a year or season is known. */
  releaseNote?: string;
  /** First regular airing of a documented weekly schedule. */
  weeklyFrom?: string;
  premiered?: { season: "winter" | "spring" | "summer" | "fall"; year: number };
  broadcast?: string;
  broadcasts: BroadcastInfo[];
  studios: number[];
  producers: number[];
  licensors: { companyId: number; visibleFrom: string | null }[];
  source: string | null;
  genres: string[];
  themes: string[];
  duration: string | null;
  rating: string | null;
  synopsis: string | null;
  synopsisSource?: string;
  background: TimedText[];
  cover?: string;
  /** When the entry was added to YAL. */
  visibleFrom: string | null;
  franchise?: string;
  staff: StaffCredit[];
  characters: { characterId: number; role: "Main" | "Supporting"; visibleFrom?: string | null }[];
  voices: VoiceCredit[];
  themesSongs: ThemeSong[];
  episodeList: Episode[];
  relations: Relation[];
  scores: ScoreSnapshot[];
  streaming?: { name: string; note: string; visibleFrom: string | null }[];
  provenance: Provenance;
  sources: SourceNote[];
  /** Notes about deliberately missing data, shown on the page. */
  archiveNotes?: string[];
  /**
   * The profile page is being planned separately. The entry still exists
   * (threads, characters and credits link to it) but its page shows a
   * "coming soon" notice instead of the full profile.
   */
  pagePlanned?: boolean;
}

export interface CharacterFact {
  text: string;
  /** Episode whose broadcast reveals this. Facts are hidden before it airs. */
  revealedAt: string | null;
}

export interface Character {
  /** Held back until this development phase is enabled. */
  phase?: FuturePhase;
  id: number;
  slug: string;
  name: string;
  nativeName?: string;
  /** Short role line, e.g. "Hammond Council 1 President". */
  role: string;
  /** When the character was first publicly known. */
  visibleFrom: string | null;
  bio: CharacterFact[];
  relationships: { characterId: number; label: string; revealedAt: string | null }[];
  sources: SourceNote[];
}

export interface Manga {
  /** Held back until this development phase is enabled. */
  phase?: FuturePhase;
  id: number;
  slug: string;
  title: string;
  titleJapanese?: string;
  type: "Manga" | "Light Novel" | "One-shot";
  authors: { personId: number; role: string }[];
  status: string | null;
  volumes: number | null;
  chapters: number | null;
  published: string | null;
  serialization: string | null;
  genres: string[];
  synopsis: string | null;
  background: string | null;
  visibleFrom: string | null;
  relations: Relation[];
  provenance: Provenance;
  sources: SourceNote[];
}

export interface NewsItem {
  /** Held back until this development phase is enabled. */
  phase?: FuturePhase;
  id: number;
  slug: string;
  title: string;
  publishedAt: string;
  author: string;
  body: string; // BBCode
  related: { type: "anime" | "manga" | "company" | "person"; id: number }[];
  provenance: Provenance;
  source?: SourceNote;
}

/** A dated fact on the archive timeline (premieres, releases, announcements). */
export interface HistoricalEvent {
  id: string;
  at: string;
  label: string;
  related: { type: "anime" | "manga" | "company" | "person"; id: number }[];
  provenance: Provenance;
  source?: SourceNote;
}

export interface ForumBoard {
  slug: string;
  name: string;
  description: string;
  group: "Anime & Manga" | "Community" | "YAL";
}

export interface ArchiveSnapshot {
  capturedAt: string;
  replies: number;
  views: number;
  lastReplyAt: string;
  lastReplyBy: string;
  status: string;
}

export interface Thread {
  /** Held back until this development phase is enabled. */
  phase?: FuturePhase;
  id: string;
  board: string;
  title: string;
  author: string;
  createdAt: string;
  createdTz?: string;
  animeId?: number;
  episode?: number;
  pinned?: boolean;
  locked?: boolean;
  /** Archive capture of aggregate counts — never mixed with live counts. */
  snapshot?: ArchiveSnapshot;
  sidebar?: {
    episodeTitle?: string;
    hotSubthreads?: { title: string; replies: number; threadId?: string }[];
    viewers?: { total: number; members: number; guests: number; names: string[] };
    poll?: { question: string; totalVotes: number; options: { label: string; percent: number }[] };
  };
  /** Subthreads whose posts were not recovered. */
  postsRecovered?: boolean;
  parentThreadId?: string;
  provenance: Provenance;
}

export interface ArchivedPost {
  n: number;
  author: string;
  av: string;
  at: string;
  tz: string;
  body: string;
  authorPosts: number | null;
  online: boolean;
  rank?: string;
  announcement?: boolean;
  editedAt?: string;
  editedTz?: string;
  editReason?: string;
}

export interface ArchivedThreadFile {
  threads: {
    title: string;
    createdAt: string;
    createdTz: string;
    archive: { replies: number; views: number; lastReplyAt: string; lastReplyBy: string; status: string };
    sidebar: {
      episodeTitle?: string;
      hotSubthreads?: { title: string; replies: number }[];
      viewers?: { total: number; members: number; guests: number; names: string[] };
      poll?: { question: string; totalVotes: number; options: { label: string; percent: number }[] };
    };
    episode: number;
    pages: number;
    posts: ArchivedPost[];
  }[];
  users: {
    name: string;
    avatar: string;
    rank: string | null;
    joined: string | null;
    mod: boolean;
    maxPosts: number;
    firstSeen: string;
    altAvatars?: string[];
  }[];
}

/** A community member known from the archive (not a live account). */
export interface ArchiveMember {
  name: string;
  avatar: string;
  rank: string;
  joinedAt: string | null;
  joinedLabel: string | null;
  moderator: boolean;
  provenance: Provenance;
  about?: string;
}

export interface SeedReview {
  /** Held back until this development phase is enabled. */
  phase?: FuturePhase;
  id: string;
  animeId: number;
  author: string;
  postedAt: string;
  episodesSeen: number;
  overall: number;
  story: number;
  animation: number;
  sound: number;
  character: number;
  enjoyment: number;
  body: string;
  helpful: number;
  provenance: Provenance;
}

export interface SeedRecommendation {
  /** Held back until this development phase is enabled. */
  phase?: FuturePhase;
  id: string;
  from: number;
  to: number;
  author: string;
  postedAt: string;
  reason: string;
  provenance: Provenance;
}
