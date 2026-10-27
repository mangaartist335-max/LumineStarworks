// Flow Pictures' official site: its news posts. Works, staff and music come
// from data/catalogue.ts. News only covers dates the Bible records.

import { HOST } from "@/lib/web/hosts";

export const FLOW_HOST = HOST.flow;

export interface FlowNews {
  id: string;
  at: string;
  title: string;
  body: string;
  work?: string;
}

export const flowNews: FlowNews[] = [
  { id: "fn_sinful_start", at: "2011-08-15T03:00:00Z", title: "Sinful Apex begins tonight", body: "Our new TV series Sinful Apex starts tonight and airs every Monday. We hope you enjoy it as much as we enjoyed making it!", work: "sinful-apex" },
  { id: "fn_sinful_thanks", at: "2012-01-23T15:00:00Z", title: "Thank you for watching Sinful Apex", body: "Tonight's episode 24 brings Sinful Apex to a close. To everyone who spent their Monday nights with us since August: thank you, from all of us at Flow Pictures.", work: "sinful-apex" },
  { id: "fn_bluray_announce", at: "2013-10-06T15:00:00Z", title: "Sinful Apex: Complete Collection on Blu-ray, November 19", body: "Funmaxation will release all 24 episodes of Sinful Apex on Blu-ray on November 19, 2013.", work: "sinful-apex" },
  { id: "fn_bluray_out", at: "2013-11-19T03:00:00Z", title: "Sinful Apex: Complete Collection is out today", body: "The Funmaxation Blu-ray collection of Sinful Apex is out today. Thank you for all your support!", work: "sinful-apex" },
];

/** A 2012 title is listed from the start of 2012; everything earlier always. */
export const workListedFrom = (year: number) => (year >= 2012 ? Date.parse(`${year}-01-01T00:00:00+09:00`) : 0);
