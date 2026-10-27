import "server-only";
import { seedRecommendationsFor, seedReviewsFor, getAnime } from "./catalog";
import { getArchiveMember } from "./archive";
import { getStore } from "./store";
import { happened, ms } from "./time";

export interface DisplayReview {
  id: string;
  animeId: number;
  author: string;
  avatar: string;
  postedAt: string;
  episodesSeen: number;
  overall: number;
  story: number;
  animation: number;
  sound: number;
  character: number;
  enjoyment: number;
  body: string;
  helpful: number | null;
  origin: "reconstructed" | "member";
}

export interface DisplayRecommendation {
  id: string;
  fromId: number;
  toId: number;
  author: string;
  reason: string;
  postedAt: string;
  origin: "reconstructed" | "member";
}

export async function reviewsFor(asOf: string, animeId?: number): Promise<DisplayReview[]> {
  const seeded: DisplayReview[] = seedReviewsFor(asOf, animeId).map((r) => ({
    ...r,
    avatar: getArchiveMember(r.author)?.avatar ?? "av-default",
    origin: "reconstructed",
  }));
  const store = getStore();
  const memberRows = (await store.listReviews(animeId)).filter((r) => happened(r.postedAt, asOf) && getAnime(r.animeId, asOf));
  const accounts = new Map((await store.getAccountsById([...new Set(memberRows.map((r) => r.authorId))])).map((a) => [a.id, a]));
  const member: DisplayReview[] = memberRows.map((r) => ({
    id: r.id,
    animeId: r.animeId,
    author: r.authorName,
    avatar: accounts.get(r.authorId)?.avatar ?? "av-default",
    postedAt: r.postedAt,
    episodesSeen: r.episodesSeen,
    overall: r.overall,
    story: r.story,
    animation: r.animation,
    sound: r.sound,
    character: r.character,
    enjoyment: r.enjoyment,
    body: r.body,
    helpful: null,
    origin: "member",
  }));
  return [...seeded, ...member].sort((a, b) => ms(b.postedAt) - ms(a.postedAt));
}

export async function recommendationsFor(asOf: string, animeId?: number): Promise<DisplayRecommendation[]> {
  const seeded: DisplayRecommendation[] = seedRecommendationsFor(asOf, animeId).map((r) => ({
    id: r.id,
    fromId: r.from,
    toId: r.to,
    author: r.author,
    reason: r.reason,
    postedAt: r.postedAt,
    origin: "reconstructed",
  }));
  const member: DisplayRecommendation[] = (await getStore().listRecommendations(animeId))
    .filter((r) => happened(r.postedAt, asOf) && getAnime(r.fromId, asOf) && getAnime(r.toId, asOf))
    .map((r) => ({ id: r.id, fromId: r.fromId, toId: r.toId, author: r.authorName, reason: r.reason, postedAt: r.postedAt, origin: "member" }));
  return [...seeded, ...member].sort((a, b) => ms(b.postedAt) - ms(a.postedAt));
}
