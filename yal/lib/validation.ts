import { z } from "zod";
import { MAX_BODY_LENGTH } from "./bbcode";
import { LIST_STATUSES } from "./store/types";

// Avatars a member may pick: the archived set, minus the staff bot's badge.
export const PICKABLE_AVATARS = [
  "av-default", "av-starcircuit", "av-nekotoast", "av-mecharonin", "av-bluesoda", "av-vhssamurai",
  "av-kiranotkira", "av-planetkid", "av-luckynoodle", "av-3eprule", "av-sakurastatic", "av-zeroframe",
  "av-forumgoblin", "av-moonlitpixel", "av-abigailfan", "av-robomango", "av-kaichouenjoyer",
  "av-sleepysenpai", "av-cyberlunchbox", "av-hollowtoast", "av-retrobluray", "av-stormwalltheory",
  "av-sorawatcher", "av-natewatcher", "av-chibicomet", "av-finalbossu", "av-millenniumfan", "av-day01",
  "av-rawrxd", "av-toonblock", "av-hyperneko", "av-shadowtoast", "av-kitchenstar", "av-goldensloth",
  "av-nodeomega", "av-drowsyvhs", "av-vermilionowl", "av-ciphercaramel", "av-calsparrow",
  "av-bostonbean", "av-okamoto", "av-kappazero", "av-guestfirework", "av-guestink", "av-guestcone",
  "av-guestsignal",
] as const;

export const RESERVED_NAMES = ["yalbot", "admin", "administrator", "moderator", "staff", "yal", "system", "guest"];

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Usernames need at least 3 characters.")
  .max(20, "Usernames can be at most 20 characters.")
  .regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, underscores and dashes.");

export const registerSchema = z.object({
  username: usernameSchema,
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(200),
  password: z.string().min(8, "Passwords need at least 8 characters.").max(200),
  avatar: z.enum(PICKABLE_AVATARS),
  terms: z.literal("on", { message: "Please agree to the Terms of Use." }),
});

export const postBodySchema = z
  .string()
  .trim()
  .min(2, "Your post is too short.")
  .max(MAX_BODY_LENGTH, `Posts can be at most ${MAX_BODY_LENGTH.toLocaleString("en-US")} characters.`);

export const threadTitleSchema = z.string().trim().min(4, "Titles need at least 4 characters.").max(120, "Titles can be at most 120 characters.");

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use the date picker (YYYY-MM-DD).");

export const listEntrySchema = z.object({
  animeId: z.coerce.number().int().positive(),
  status: z.enum(LIST_STATUSES),
  episodesWatched: z.coerce.number().int().min(0).max(9999),
  score: z
    .string()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 10), "Scores go from 1 to 10."),
  startDate: optionalDate,
  finishDate: optionalDate,
  notes: z.string().trim().max(1000, "Notes can be at most 1,000 characters."),
});

const score10 = z.coerce.number().int().min(1).max(10);
export const reviewSchema = z.object({
  animeId: z.coerce.number().int().positive(),
  episodesSeen: z.coerce.number().int().min(1).max(9999),
  overall: score10,
  story: score10,
  animation: score10,
  sound: score10,
  character: score10,
  enjoyment: score10,
  body: z.string().trim().min(200, "Reviews need at least 200 characters.").max(MAX_BODY_LENGTH),
});

export const recommendationSchema = z.object({
  fromId: z.coerce.number().int().positive(),
  toId: z.coerce.number().int().positive(),
  reason: z.string().trim().min(40, "Tell people why in at least 40 characters.").max(1500),
});

export const profileSchema = z.object({
  avatar: z.enum(PICKABLE_AVATARS),
  about: z.string().trim().max(2000),
  location: z.string().trim().max(60),
  timeZone: z.enum(["JST", "GMT", "CET", "EST", "EDT", "PST", "PDT"]),
});

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Please check the form and try again.";
}

/** Only allow redirects to site-relative paths. */
export function safeNext(raw: FormDataEntryValue | string | null | undefined, fallback = "/"): string {
  if (typeof raw !== "string") return fallback;
  return /^\/(?!\/)[^\s]*$/.test(raw) ? raw : fallback;
}
