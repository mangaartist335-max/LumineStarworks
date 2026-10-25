// Studios, companies and people with verified pre-2014 records.

import type { Company, Person } from "./types";
import { SRC } from "./sources";
import { catalogueCompanies, cataloguePeople } from "./catalogue-people";
import { active, IOE_PHASE, phaseText } from "./release";

// The Impact of Eden entry was added to YAL with the Fall 2013 season chart.
export const IOE_LISTED = "2013-09-14T15:00:00Z"; // Sep 15, 2013 00:00 JST

const establishedCompanies: Company[] = [
  {
    id: 1,
    slug: "Studio_Burst",
    name: "Studio Burst",
    kinds: ["Studio"],
    foundedNote: "Formed out of Flow Pictures' late-era cinematic unit at the conclusion of Sinful Apex (2011).",
    about:
      "Japanese animation studio. Impact of Eden (2013) is the studio's first animated work: Burst has no earlier ONA, short or pilot credits. Much of its founding staff carried over from the Flow Pictures unit that produced Sinful Apex, including director Kaihatsu Miura.",
    visibleFrom: IOE_LISTED,
    sources: [SRC.aniFanWiki, SRC.aniWirePremiere, SRC.brief],
  },
  {
    id: 2,
    slug: "Flow_Pictures",
    name: "Flow Pictures",
    kinds: ["Studio"],
    about:
      phaseText(
        IOE_PHASE,
        "Japanese animation studio. Its late-era cinematic unit produced Sinful Apex (2011–2012), the production often described as the studio's \"final breath\". Studio Burst was formed out of that unit.",
        "Japanese animation studio. Its late-era cinematic unit produced Sinful Apex (2011–2012), the production often described as the studio's \"final breath\".",
      ),
    visibleFrom: null,
    sources: [SRC.brief, SRC.aniFanWiki, SRC.aniWirePremiere],
  },
  {
    id: 3,
    slug: "CHAOS_Home",
    name: "CHAOS Home",
    kinds: ["Studio"],
    about: "Japanese animation studio. Produced Iron to Requiem (2013).",
    visibleFrom: null,
    sources: [SRC.brief],
  },
  {
    id: 4,
    slug: "AniBlex",
    name: "AniBlex",
    kinds: ["Producer", "Distributor"],
    about: "Production and distribution company. Distributor of Impact of Eden (2013).",
    visibleFrom: IOE_LISTED,
    sources: [SRC.aniFanWiki],
  },
  {
    id: 5,
    slug: "Funmaxation",
    name: "Funmaxation",
    kinds: ["Licensor", "Distributor"],
    about: "North American licensor and home video distributor.",
    visibleFrom: null,
    sources: [SRC.aniFanWiki, SRC.aniWirePremiere],
  },
  {
    id: 6,
    slug: "MunchyRoll",
    name: "MunchyRoll",
    kinds: ["Streaming"],
    about: "International anime streaming service offering subtitled simulcasts.",
    visibleFrom: null,
    sources: [SRC.aniFanWiki, SRC.munchyRoll],
  },
  {
    id: 7,
    slug: "AdultDrift",
    name: "AdultDrift",
    kinds: ["Broadcaster"],
    about: "English-language television broadcaster with an anime programming block.",
    visibleFrom: null,
    sources: [SRC.aniFanWiki, SRC.adultDrift],
  },
  {
    id: 8,
    slug: "VBS_KBS",
    name: "VBS/KBS",
    kinds: ["Broadcaster"],
    about: "Japanese television broadcaster.",
    visibleFrom: null,
    sources: [SRC.aniFanWiki],
  },
  {
    id: 9,
    slug: "Sony_Music_Japan",
    name: "Sony Music Japan",
    kinds: ["Record label"],
    about: phaseText(IOE_PHASE, "Record label. Released the \"Human x Inhuman\" single on October 16, 2013.", "Record label."),
    visibleFrom: null,
    sources: [SRC.aniFanWiki],
  },
];

const establishedPeople: Person[] = [
  {
    id: 1,
    slug: "Natsuki_Takuya",
    name: "Natsuki Takuya",
    occupations: ["Manga artist", "Original creator"],
    about:
      "Manga artist and creator of Impact of Eden. Takuya's writing is known for women whose authority comes from stillness and composure, a philosophy fans credit for the way the 2013 anime frames its female cast.",
    visibleFrom: null,
    sources: [SRC.brief, SRC.aniFanWiki, SRC.yalEp1],
  },
  {
    id: 2,
    slug: "Kaihatsu_Miura",
    name: "Kaihatsu Miura",
    occupations: ["Director"],
    about: phaseText(
      IOE_PHASE,
      "Director known for dense, no-padding pacing. Directed Sinful Apex at Flow Pictures before moving to Studio Burst for Impact of Eden.",
      "Director known for dense, no-padding pacing. Directed Sinful Apex at Flow Pictures.",
    ),
    visibleFrom: null,
    sources: [SRC.brief, SRC.sakugaThread, SRC.yalEp1Page4],
  },
  {
    id: 3,
    slug: "Keito_Kisaragi",
    name: "Keito Kisaragi",
    occupations: ["Series composition", "Writer"],
    about: "Writer known for emotional through-lines and political tension.",
    visibleFrom: null,
    sources: [SRC.brief, SRC.yalEp1Page4],
  },
  {
    id: 4,
    slug: "Lio_Haraguchi",
    name: "Lio Haraguchi",
    occupations: ["Character designer", "Chief animation director"],
    about: "Character designer and chief animation director. Known for keeping faces on-model during chaotic action.",
    visibleFrom: null,
    sources: [SRC.brief, SRC.aniFanWiki, SRC.yalEp1Page4],
  },
  {
    id: 5,
    slug: "Tomoe_Suzuhara",
    name: "Tomoe Suzuhara",
    occupations: ["Storyboard artist"],
    about: phaseText(
      IOE_PHASE,
      "Storyboard artist known for long-take action and silhouette-driven fight layouts. Leads storyboards and pacing on Impact of Eden.",
      "Storyboard artist known for long-take action and silhouette-driven fight layouts.",
    ),
    visibleFrom: null,
    sources: [SRC.brief, SRC.sakugaThread, SRC.aniWirePremiere],
  },
  {
    id: 6,
    slug: "Naochi_Sumikuro",
    name: "Naochi Sumikuro",
    occupations: ["Art director"],
    about: "Art director (backgrounds and settings).",
    visibleFrom: null,
    sources: [SRC.brief, SRC.aniFanWiki],
  },
  {
    id: 7,
    slug: "Mirai_Kanzaki",
    name: "Mirai Kanzaki",
    occupations: ["Color designer"],
    visibleFrom: null,
    sources: [SRC.brief, SRC.aniFanWiki],
  },
  {
    id: 8,
    slug: "Aoi_Tachikaze",
    name: "Aoi Tachikaze",
    occupations: ["Sound director", "Audio editor"],
    visibleFrom: null,
    sources: [SRC.brief, SRC.aniFanWiki],
  },
  {
    id: 9,
    slug: "Yusuke_Kagura",
    name: "Yusuke Kagura",
    occupations: ["Action choreographer"],
    about: "Action choreographer known for tactically readable fights.",
    visibleFrom: null,
    sources: [SRC.brief, SRC.yalEp1Page4],
  },
  {
    id: 10,
    slug: "Hiroyuki_Sawano",
    name: "Hiroyuki Sawano",
    nativeName: "澤野弘之",
    occupations: ["Composer"],
    visibleFrom: null,
    sources: [SRC.brief],
  },
  {
    id: 11,
    slug: "Tsubasa_Aramaki",
    name: "Tsubasa Aramaki",
    occupations: ["Producer"],
    about: "Producer at Studio Burst.",
    visibleFrom: null,
    sources: [SRC.aniFanWiki],
  },
  {
    id: 12,
    slug: "Junpei_Oikawa",
    name: "Junpei Oikawa",
    occupations: ["Producer"],
    about: "Producer at AniBlex.",
    visibleFrom: null,
    sources: [SRC.aniFanWiki],
  },
  {
    id: 13,
    slug: "Takanori_Nishikawa",
    name: "Takanori Nishikawa",
    nativeName: "西川貴教",
    occupations: ["Singer"],
    about: "Singer who performs as T.M.Revolution.",
    visibleFrom: null,
    sources: [SRC.aniFanWiki],
  },
  {
    id: 14,
    slug: "LUNE",
    name: "LUNE",
    occupations: ["Singer"],
    about: "Singer. Appeared in Sinful Apex as the fictional singer Aria Moonbirth.",
    visibleFrom: null,
    sources: [SRC.archiveBrief],
  },
  // Japanese voice cast of Impact of Eden (2013)
  { id: 20, slug: "Mariya_Ise", name: "Mariya Ise", nativeName: "伊瀬茉莉也", occupations: ["Voice actor"], visibleFrom: null, sources: [SRC.aniFanWiki] },
  { id: 21, slug: "Nobuhiko_Okamoto", name: "Nobuhiko Okamoto", nativeName: "岡本信彦", occupations: ["Voice actor"], visibleFrom: null, sources: [SRC.aniFanWiki] },
  { id: 22, slug: "Kana_Hanazawa", name: "Kana Hanazawa", nativeName: "花澤香菜", occupations: ["Voice actor"], visibleFrom: null, sources: [SRC.aniFanWiki] },
  { id: 23, slug: "Kaito_Ishikawa", name: "Kaito Ishikawa", nativeName: "石川界人", occupations: ["Voice actor"], visibleFrom: null, sources: [SRC.aniFanWiki] },
  { id: 24, slug: "Saori_Hayami", name: "Saori Hayami", nativeName: "早見沙織", occupations: ["Voice actor"], visibleFrom: null, sources: [SRC.aniFanWiki] },
  { id: 25, slug: "Rina_Satou", name: "Rina Satou", nativeName: "佐藤利奈", occupations: ["Voice actor"], visibleFrom: null, sources: [SRC.aniFanWiki] },
  { id: 26, slug: "Hiro_Shimono", name: "Hiro Shimono", nativeName: "下野紘", occupations: ["Voice actor"], visibleFrom: null, sources: [SRC.aniFanWiki] },
  { id: 27, slug: "Hiroshi_Kamiya", name: "Hiroshi Kamiya", nativeName: "神谷浩史", occupations: ["Voice actor"], visibleFrom: null, sources: [SRC.aniFanWiki] },
  { id: 28, slug: "Ayane_Sakura", name: "Ayane Sakura", nativeName: "佐倉綾音", occupations: ["Voice actor"], visibleFrom: null, sources: [SRC.aniFanWiki] },
  { id: 29, slug: "Kishou_Taniyama", name: "Kishou Taniyama", nativeName: "谷山紀章", occupations: ["Voice actor"], visibleFrom: null, sources: [SRC.aniFanWiki] },
  { id: 30, slug: "Yui_Ishikawa", name: "Yui Ishikawa", nativeName: "石川由依", occupations: ["Voice actor"], visibleFrom: null, sources: [SRC.aniFanWiki] },
  { id: 31, slug: "Yoshimasa_Hosoya", name: "Yoshimasa Hosoya", nativeName: "細谷佳正", occupations: ["Voice actor"], visibleFrom: null, sources: [SRC.aniFanWiki] },
  { id: 32, slug: "Tasuku_Hatanaka", name: "Tasuku Hatanaka", nativeName: "畠中祐", occupations: ["Voice actor"], visibleFrom: null, sources: [SRC.aniFanWiki] },
];

// Companies and people that exist only through Impact of Eden.
const IOE_COMPANIES = new Set([1, 4]); // Studio Burst, AniBlex
const IOE_PEOPLE = new Set([1, 11, 12]); // Natsuki Takuya, Tsubasa Aramaki, Junpei Oikawa

export const allCompanies: Company[] = [...establishedCompanies, ...catalogueCompanies].map((c) => (IOE_COMPANIES.has(c.id) ? { ...c, phase: IOE_PHASE } : c));
export const allPeople: Person[] = [...establishedPeople, ...cataloguePeople].map((p) => (IOE_PEOPLE.has(p.id) ? { ...p, phase: IOE_PHASE } : p));
export const companies: Company[] = active(allCompanies);
export const people: Person[] = active(allPeople);
