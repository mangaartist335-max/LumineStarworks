import type {
  AgeRating,
  BroadcastCadence,
  BroadcastKind,
  CastBilling,
  CastCreditType,
  CompanyKind,
  CompanyRole,
  CreditRole,
  Demographic,
  EntityType,
  Occupation,
  ProductionFormat,
  Provenance,
  Relation,
  SeasonName,
  SourceDocumentKind,
  SourceMaterial,
  StudioRole,
  ThemeUsage,
  TrackCreditRole,
  TrackKind,
} from "./types";

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  confirmed: "Confirmed",
  provisional: "Provisional",
  proposed: "Proposed",
  conflicting: "Conflicting",
  superseded: "Superseded",
};

export const PROVENANCE_DESCRIPTION: Record<Provenance, string> = {
  confirmed: "Established by an approved source document.",
  provisional: "Recorded from a source but still awaiting confirmation.",
  proposed: "Sample or suggested entry — not part of established history until approved.",
  conflicting: "Sources disagree; an editor needs to review this record.",
  superseded: "Replaced by a later correction and kept for history.",
};

/** Higher rank wins when two sources disagree. */
export const PROVENANCE_RANK: Record<Provenance, number> = {
  confirmed: 4,
  provisional: 3,
  proposed: 2,
  conflicting: 1,
  superseded: 0,
};

export const SEASON_LABEL: Record<SeasonName, string> = {
  winter: "Winter",
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
};

export const SEASON_NATIVE: Record<SeasonName, string> = {
  winter: "冬",
  spring: "春",
  summer: "夏",
  fall: "秋",
};

export const SEASON_MONTHS: Record<SeasonName, string> = {
  winter: "January – March",
  spring: "April – June",
  summer: "July – September",
  fall: "October – December",
};

export const FORMAT_LABEL: Record<ProductionFormat, string> = {
  tv: "TV Series",
  tv_special: "TV Special",
  film: "Theatrical Film",
  ova: "OVA",
  ona: "ONA",
  special: "Special",
  music_video: "Music Video",
};

export const FORMAT_SHORT: Record<ProductionFormat, string> = {
  tv: "TV",
  tv_special: "TV Special",
  film: "Film",
  ova: "OVA",
  ona: "ONA",
  special: "Special",
  music_video: "MV",
};

export const SOURCE_LABEL: Record<SourceMaterial, string> = {
  original: "Original",
  manga: "Manga",
  web_manga: "Web manga",
  light_novel: "Light novel",
  novel: "Novel",
  visual_novel: "Visual novel",
  game: "Game",
  music: "Music",
  other: "Other",
};

export const DEMOGRAPHIC_LABEL: Record<Demographic, string> = {
  shounen: "Shounen",
  shoujo: "Shoujo",
  seinen: "Seinen",
  josei: "Josei",
  kids: "Kids",
  general: "General",
};

export const AGE_RATING_LABEL: Record<AgeRating, string> = {
  G: "G — All ages",
  PG: "PG — Children",
  "PG-13": "PG-13 — Teens 13 or older",
  "R-15+": "R-15+ — 15 or older",
  "R-17+": "R-17+ — 17 or older",
};

export const BROADCAST_KIND_LABEL: Record<BroadcastKind, string> = {
  tv: "Television broadcast",
  advance: "Advance broadcast",
  streaming: "Streaming premiere",
  special_broadcast: "Special broadcast",
  dub: "English dub",
  theatrical: "Theatrical release",
  home_video: "Home video release",
};

export const CADENCE_LABEL: Record<BroadcastCadence, string> = {
  weekly: "Weekly",
  daily: "Daily",
  single: "Single airing",
  irregular: "Irregular",
};

export const STUDIO_ROLE_LABEL: Record<StudioRole, string> = {
  animation: "Animation production",
  co_animation: "Co-animation",
  assistance: "Production assistance",
};

export const COMPANY_KIND_LABEL: Record<CompanyKind, string> = {
  production: "Production company",
  broadcaster: "Broadcast network",
  licensor: "Licensor",
  distributor: "Distributor",
  streaming: "Streaming service",
  music_label: "Music label",
  other: "Other",
};

export const COMPANY_ROLE_LABEL: Record<CompanyRole, string> = {
  production_committee: "Production committee",
  producer: "Producer",
  licensor: "Licensor",
  distributor: "Distributor",
  streaming: "Streaming",
  music: "Music",
};

export const CREDIT_ROLE_LABEL: Record<CreditRole, string> = {
  original_creator: "Original creator",
  director: "Director",
  assistant_director: "Assistant director",
  series_composition: "Series composition",
  screenplay: "Screenplay",
  storyboard: "Storyboard",
  character_design: "Character design",
  chief_animation_director: "Chief animation director",
  animation_director: "Animation director",
  action_choreographer: "Action choreographer",
  mecha_design: "Mechanical design",
  art_director: "Art director",
  color_design: "Color design",
  director_of_photography: "Director of photography",
  cg_director: "CG director",
  editing: "Editing",
  sound_director: "Sound director",
  music: "Music",
  producer: "Producer",
  animation_producer: "Animation producer",
  other: "Other",
};

export const CREDIT_DEPARTMENTS: { label: string; roles: CreditRole[] }[] = [
  {
    label: "Direction",
    roles: ["original_creator", "director", "assistant_director", "storyboard"],
  },
  { label: "Writing", roles: ["series_composition", "screenplay"] },
  {
    label: "Animation & Design",
    roles: [
      "character_design",
      "chief_animation_director",
      "animation_director",
      "action_choreographer",
      "mecha_design",
      "cg_director",
    ],
  },
  {
    label: "Art & Photography",
    roles: ["art_director", "color_design", "director_of_photography", "editing"],
  },
  { label: "Sound & Music", roles: ["sound_director", "music"] },
  { label: "Production", roles: ["producer", "animation_producer", "other"] },
];

export const OCCUPATION_LABEL: Record<Occupation, string> = {
  director: "Director",
  writer: "Writer",
  composer: "Composer",
  animator: "Animator",
  character_designer: "Character designer",
  art_director: "Art director",
  voice_actor: "Voice actor",
  singer: "Singer",
  producer: "Producer",
  sound_director: "Sound director",
  other: "Other",
};

/** Which occupation a credit implies, used to keep people profiles in sync with credits. */
export const ROLE_OCCUPATION: Partial<Record<CreditRole, Occupation>> = {
  original_creator: "writer",
  director: "director",
  assistant_director: "director",
  series_composition: "writer",
  screenplay: "writer",
  storyboard: "animator",
  character_design: "character_designer",
  chief_animation_director: "animator",
  animation_director: "animator",
  action_choreographer: "animator",
  mecha_design: "animator",
  art_director: "art_director",
  color_design: "art_director",
  director_of_photography: "other",
  cg_director: "animator",
  sound_director: "sound_director",
  music: "composer",
  producer: "producer",
  animation_producer: "producer",
};

export const CAST_TYPE_LABEL: Record<CastCreditType, string> = {
  voice: "Voice",
  singing_voice: "Singing voice",
  appearance: "Appears as",
};

export const BILLING_LABEL: Record<CastBilling, string> = {
  main: "Main",
  supporting: "Supporting",
  guest: "Guest",
};

export const TRACK_KIND_LABEL: Record<TrackKind, string> = {
  song: "Song",
  score: "Score cue",
  single: "Single",
  album: "Album",
  soundtrack: "Original soundtrack",
};

export const TRACK_ROLE_LABEL: Record<TrackCreditRole, string> = {
  performer: "Performer",
  composer: "Composer",
  lyricist: "Lyricist",
  arranger: "Arranger",
};

export const THEME_USAGE_LABEL: Record<ThemeUsage, string> = {
  opening: "Opening theme",
  ending: "Ending theme",
  insert: "Insert song",
  soundtrack: "Original soundtrack",
  image_song: "Image song",
};

export const THEME_USAGE_SHORT: Record<ThemeUsage, string> = {
  opening: "OP",
  ending: "ED",
  insert: "Insert",
  soundtrack: "OST",
  image_song: "Image",
};

export const RELATION_LABEL: Record<Relation, string> = {
  sequel: "Sequel",
  prequel: "Prequel",
  side_story: "Side story",
  special: "Special",
  film: "Film",
  ova: "OVA",
  spin_off: "Spin-off",
  compilation: "Compilation",
  alternative: "Alternative version",
  parent_story: "Parent story",
};

/** The relation as seen from the other side. */
export const INVERSE_RELATION: Record<Relation, Relation> = {
  sequel: "prequel",
  prequel: "sequel",
  side_story: "parent_story",
  special: "parent_story",
  film: "parent_story",
  ova: "parent_story",
  spin_off: "parent_story",
  compilation: "parent_story",
  alternative: "alternative",
  parent_story: "side_story",
};

export const SOURCE_DOCUMENT_KIND_LABEL: Record<SourceDocumentKind, string> = {
  brief: "Development brief",
  production_document: "Production document",
  press_release: "Press release",
  import: "Structured import",
  editorial: "Editorial note",
};

export const ENTITY_LABEL: Record<EntityType, string> = {
  source_document: "Source document",
  franchise: "Franchise",
  studio: "Studio",
  person: "Person",
  company: "Company",
  production: "Production",
  production_studio: "Studio assignment",
  production_company: "Company assignment",
  broadcast_run: "Broadcast run",
  episode: "Episode",
  episode_release: "Episode release",
  production_credit: "Staff credit",
  voice_credit: "Cast credit",
  music_track: "Music track",
  track_credit: "Track credit",
  theme_song: "Theme song assignment",
  related_media: "Related media link",
};

export const WEEKDAY_LABEL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const LANGUAGE_LABEL: Record<string, string> = {
  ja: "Japanese",
  en: "English",
};

export const GENRE_SUGGESTIONS = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Science Fiction",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];
