// Member data (accounts, lists, posts, reviews ...) behind one interface,
// implemented by a local JSON file store and a Supabase store.
//
// Every record carries two clocks:
// - an in-world time (`joinedAt`, `postedAt`, `updatedAt`): the archive
//   moment the member was browsing when they acted, used for visibility;
// - `recordedAt`: the real time the row was written.

export const LIST_STATUSES = ["Watching", "Completed", "On-Hold", "Dropped", "Plan to Watch"] as const;
export type ListStatus = (typeof LIST_STATUSES)[number];

export interface Favorites {
  anime: number[];
  manga: number[];
  characters: number[];
  people: number[];
}

export interface Account {
  id: string;
  username: string;
  avatar: string;
  about: string;
  location: string;
  /** Display zone for timestamps, e.g. "JST". */
  timeZone: string;
  joinedAt: string;
  recordedAt: string;
  favorites: Favorites;
}

export interface ListEntry {
  userId: string;
  animeId: number;
  status: ListStatus;
  episodesWatched: number;
  score: number | null;
  startDate: string | null;
  finishDate: string | null;
  notes: string;
  updatedAt: string;
  recordedAt: string;
}

export interface MemberThread {
  id: string;
  board: string;
  title: string;
  authorId: string;
  authorName: string;
  animeId: number | null;
  createdAt: string;
  recordedAt: string;
}

export interface MemberPost {
  id: string;
  threadId: string;
  number: number;
  authorId: string;
  authorName: string;
  body: string;
  postedAt: string;
  recordedAt: string;
  editedAt: string | null;
}

export interface Review {
  id: string;
  animeId: number;
  authorId: string;
  authorName: string;
  postedAt: string;
  episodesSeen: number;
  overall: number;
  story: number;
  animation: number;
  sound: number;
  character: number;
  enjoyment: number;
  body: string;
  recordedAt: string;
}

export interface Recommendation {
  id: string;
  fromId: number;
  toId: number;
  authorId: string;
  authorName: string;
  reason: string;
  postedAt: string;
  recordedAt: string;
}

export interface Friendship {
  userId: string;
  friendName: string;
  since: string;
}

export interface Report {
  id: string;
  reporterId: string;
  threadId: string;
  postKey: string;
  reason: string;
  reportedAt: string;
  recordedAt: string;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  avatar: string;
  joinedAt: string;
}

export interface YalStore {
  readonly mode: "local" | "supabase";

  // Sessions & accounts
  currentAccount(): Promise<Account | null>;
  register(input: RegisterInput): Promise<Result<Account>>;
  signIn(login: string, password: string): Promise<Result<Account>>;
  signOut(): Promise<void>;
  getAccountByName(username: string): Promise<Account | null>;
  getAccountsById(ids: string[]): Promise<Account[]>;
  listAccounts(): Promise<Account[]>;
  updateProfile(userId: string, patch: Partial<Pick<Account, "avatar" | "about" | "location" | "timeZone">>): Promise<Result<Account>>;
  setFavorite(userId: string, kind: keyof Favorites, id: number, on: boolean): Promise<Result<Favorites>>;

  // Anime lists
  getList(userId: string): Promise<ListEntry[]>;
  getListEntry(userId: string, animeId: number): Promise<ListEntry | null>;
  saveListEntry(entry: Omit<ListEntry, "recordedAt">): Promise<Result<ListEntry>>;
  removeListEntry(userId: string, animeId: number): Promise<void>;
  listEntriesForAnime(animeId: number): Promise<ListEntry[]>;
  allListEntries(): Promise<ListEntry[]>;

  // Forums
  listMemberThreads(board?: string): Promise<MemberThread[]>;
  getMemberThread(id: string): Promise<MemberThread | null>;
  createThread(input: Omit<MemberThread, "id" | "recordedAt">, firstPostBody: string): Promise<Result<MemberThread>>;
  listMemberPosts(threadId?: string): Promise<MemberPost[]>;
  listMemberPostsByAuthor(authorId: string): Promise<MemberPost[]>;
  createPost(input: Omit<MemberPost, "id" | "number" | "recordedAt" | "editedAt">, archiveMaxNumber: number): Promise<Result<MemberPost>>;
  followThread(userId: string, threadId: string, on: boolean): Promise<void>;
  listFollows(userId: string): Promise<string[]>;
  reportPost(input: Omit<Report, "id" | "recordedAt">): Promise<Result<Report>>;

  // Reviews & recommendations
  listReviews(animeId?: number): Promise<Review[]>;
  createReview(input: Omit<Review, "id" | "recordedAt">): Promise<Result<Review>>;
  listRecommendations(animeId?: number): Promise<Recommendation[]>;
  createRecommendation(input: Omit<Recommendation, "id" | "recordedAt">): Promise<Result<Recommendation>>;

  // Friends
  listFriends(userId: string): Promise<Friendship[]>;
  setFriend(userId: string, friendName: string, on: boolean, since: string): Promise<void>;
}
