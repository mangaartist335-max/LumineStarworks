import { SearchIndex } from "@/lib/search";
import { buildSearchDocs } from "@/data/search-docs";

let index: SearchIndex | null = null;

/** The Connected Era web index, built once per session from the archive data. */
export function getSearchIndex(): SearchIndex {
  if (!index) index = new SearchIndex(buildSearchDocs());
  return index;
}
