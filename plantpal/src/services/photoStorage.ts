import { Directory, File, Paths } from "expo-file-system";

// The image picker hands back a file in a temporary cache folder that the OS
// may clear. Photos are copied into the app's documents folder so they stick.
const PHOTO_DIR_NAME = "plant-photos";

function photoDirectory(): Directory {
  const dir = new Directory(Paths.document, PHOTO_DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function isStoredPhoto(uri: string): boolean {
  return uri.startsWith(photoDirectory().uri);
}

/** Copies a picked photo into permanent storage and returns its new URI. */
export async function persistPhoto(uri: string | null): Promise<string | null> {
  if (!uri || isStoredPhoto(uri)) return uri;
  const extension = uri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
  const name = `plant-${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;
  const destination = new File(photoDirectory(), name);
  await new File(uri).copy(destination);
  return destination.uri;
}

/** Removes a stored photo. Never throws: a leftover file is harmless. */
export function deletePhoto(uri: string | null): void {
  if (!uri || !isStoredPhoto(uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn("[photoStorage] Couldn't delete photo", error);
  }
}
