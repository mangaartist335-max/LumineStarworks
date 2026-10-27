// News Reader's rules, free of React: fetching a feed into the offline cache
// and counting what's unread.

import type { Feed, FeedItem } from "@/data/feeds";

/** What a refresh at `now` finds: everything published by then, and which items are new since the last fetch. */
export function fetchFeed(feed: Feed, now: number, cached: FeedItem[] = []): { items: FeedItem[]; fresh: FeedItem[] } {
  const known = new Set(cached.map((i) => i.id));
  const items = feed.items.filter((i) => Date.parse(i.at) <= now);
  return { items, fresh: items.filter((i) => !known.has(i.id)) };
}

/** Cached items to show at `now` (if the clock goes back, later items hide again), newest first. */
export function shownItems(cached: FeedItem[], now: number): FeedItem[] {
  return cached.filter((i) => Date.parse(i.at) <= now).sort((a, b) => b.at.localeCompare(a.at));
}

export const unreadIn = (items: FeedItem[], read: Set<string>) => items.filter((i) => !read.has(i.id)).length;
