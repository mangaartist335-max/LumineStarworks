// The radio stations, typed. Their script lives in radio-script.json so the
// audio generator (scripts/media/radio.py) and the Radio app share it.

import type { RadioScript, Station } from "@/lib/radio";
import { media } from "./media";
import script from "./radio-script.json";

export const radioScript = script as RadioScript;
export const stations: Station[] = radioScript.stations;
export const stationById = (id: string) => stations.find((s) => s.id === id);

/** Length in seconds of a recording in the media manifest. */
export const recordingLength = (key: string) => media(key).duration ?? 0;
