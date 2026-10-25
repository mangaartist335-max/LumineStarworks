// Embedded mode: YAL shown inside the Connected Desktop's browser.
export const EMBED_PARAM = "embed";
export const EMBED_COOKIE = "yal_embed";

/** Message the embedded page sends its parent after every navigation. */
export interface EmbedLocationMessage {
  type: "yal:location";
  path: string;
  title: string;
}
