// Citations for the established references the catalogue draws on.

import type { SourceNote } from "./types";
import { IOE_PHASE, phaseText } from "./release";

// References that name Impact of Eden (a later-phase title) keep naming the
// source and its date while that phase is off, just not the title.
const ioe = (full: string, neutral: string) => phaseText(IOE_PHASE, full, neutral);

export const SRC = {
  brief: { cite: "Lumine StarWorks YAL development brief (established production data)" },
  archiveBrief: { cite: "Lumine StarWorks Anime Industry Archive brief (established chronology)" },
  yalEp1: { cite: ioe("YAL Impact of Eden Episode 1 Discussion (archived Oct 9, 2013)", "YAL episode discussion thread (archived Oct 9, 2013)") },
  yalEp2: { cite: ioe("YAL Impact of Eden Episode 2 Discussion (archived Oct 16, 2013)", "YAL episode discussion thread (archived Oct 16, 2013)") },
  yalEp3: { cite: ioe("YAL Impact of Eden Episode 3 Discussion (archived Oct 23, 2013)", "YAL episode discussion thread (archived Oct 23, 2013)") },
  yalEp1Page4: { cite: ioe("YAL Impact of Eden Episode 1 Discussion, page 4 (staff credit roundup)", "YAL episode discussion staff-credit roundup (Oct 2013)") },
  aniFanWiki: { cite: ioe("AniFanWiki, \"Impact of Eden (2013)\" (last edited Oct 8, 2013)", "AniFanWiki article (last edited Oct 8, 2013)") },
  aniWirePremiere: { cite: ioe("AniWire, \"'Impact of Eden' Premiere Review\" (Oct 6, 2013)", "AniWire premiere review (Oct 6, 2013)") },
  sakugaThread: { cite: ioe("SakugaThread, \"Impact of Eden EP1 Sakuga Megathread\" (Oct 6, 2013)", "SakugaThread megathread (Oct 6, 2013)") },
  munchyRoll: { cite: ioe("MunchyRoll catalogue page for Impact of Eden (2013)", "MunchyRoll catalogue page (2013)") },
  adultDrift: { cite: ioe("AdultDrift programme page for Impact of Eden", "AdultDrift programme page (2013)") },
  reconstruction: { cite: "Written for the Lumine StarWorks reconstruction" },
  bibleCatalogue: { cite: "Connected Era Master Bible v1.0, ch. 18: Flow Pictures earlier catalogue" },
  biblePeople: { cite: "Connected Era Master Bible v1.0, ch. 18: people registry" },
  bibleFranchise: { cite: "Connected Era Master Bible v1.0, ch. 16: franchise registry" },
  bibleMusic: { cite: "Connected Era Master Bible v1.0, ch. 19: LUNE's documented trajectory [F07]" },
} satisfies Record<string, SourceNote>;
