// MeTube's user data. Archive videos ship with the project; everything
// people do (uploads, likes, comments, playlists...) is stored on the
// computer with origin "user", so the two never mix.

export interface MtUpload {
  id: string;
  owner: string;
  ownerName: string;
  ownerAvatar: string;
  title: string;
  description: string;
  category: string;
  blobId: string;
  mime: string;
  duration: number;
  thumb: string;
  uploadedAt: string;
  origin: "user";
}

export interface MtLike {
  id: string;
  owner: string;
  videoId: string;
  value: 1 | -1;
}

export interface MtFavorite {
  id: string;
  owner: string;
  videoId: string;
  at: string;
}

export interface MtPlaylist {
  id: string;
  owner: string;
  name: string;
  videoIds: string[];
  createdAt: string;
  origin: "user";
}

export interface MtSub {
  id: string;
  owner: string;
  channel: string;
  at: string;
}

export interface MtComment {
  id: string;
  owner: string;
  authorName: string;
  avatar: string;
  videoId: string;
  text: string;
  at: string;
  origin: "user";
}

export interface MtProgress {
  id: string;
  owner: string;
  videoId: string;
  position: number;
  duration: number;
  updatedAt: string;
}

export interface MtView {
  id: string;
  owner: string;
  videoId: string;
  count: number;
  lastAt: string;
}

export const COL = {
  uploads: "metube.uploads",
  likes: "metube.likes",
  favorites: "metube.favorites",
  playlists: "metube.playlists",
  subs: "metube.subs",
  comments: "metube.comments",
  progress: "metube.progress",
  views: "metube.views",
} as const;

export const pairId = (owner: string, key: string) => `${owner}:${key}`;

/** A channel handle for a local account: letters and digits only. */
export const userHandle = (name: string) => name.replace(/[^A-Za-z0-9_]/g, "") || "user";
