// Impact of Eden (2013) characters.
//
// Biography facts carry the broadcast that revealed them. A historical view
// only shows facts whose episode had aired, so later revelations never
// appear as contemporary fan knowledge.

import type { Character } from "./types";
import { SRC } from "./sources";
import { IOE_LISTED } from "./industry";
import { catalogueCharacters } from "./catalogue-people";
import { active, IOE_PHASE } from "./release";

// Regular TV broadcasts (Saturday 25:58 JST = Sunday 01:58 JST).
export const IOE_EP1 = "2013-10-05T16:58:00Z";
export const IOE_EP2 = "2013-10-12T16:58:00Z";
export const IOE_EP3 = "2013-10-19T16:58:00Z";

const ioeCharacters: Character[] = [
  {
    id: 1,
    slug: "Sora_Gauthier",
    name: "Sora Gauthier",
    role: "Male protagonist",
    visibleFrom: IOE_LISTED,
    bio: [
      {
        text: "Twelve-year-old Sora Gauthier struggled at Maple Grove City with his parents before deciding to head out on a Soul Anchor Journey to avenge his mother's survival.",
        revealedAt: null,
      },
      {
        text: "A student at Hammond Middle Academy and a child prodigy. He plays the VR MMO Planetation with his squad: Ben Smythe, Grayson Rothenberg and Abigail June.",
        revealedAt: IOE_EP1,
      },
      {
        text: "Awakens the MetaCode arm during the YAMAGA284 fight: an arm that turns into a blade, fires bullets and burst-steps. His quiet rooftop line, \"I hate later\", became the episode's most quoted moment.",
        revealedAt: IOE_EP1,
      },
      {
        text: "Keeps fighting after being shot in the arm and charges MetaCode with a bloody nose: \"By the time she pulls the trigger, go all in!\"",
        revealedAt: IOE_EP2,
      },
      {
        text: "Beats Nero's prediction algorithm in the Battle Circle by abandoning flash-steps for an ordinary, human step, then signs off with a cheeky \"Later~\".",
        revealedAt: IOE_EP3,
      },
    ],
    relationships: [
      { characterId: 5, label: "Squadmate", revealedAt: IOE_EP1 },
      { characterId: 3, label: "Squadmate", revealedAt: IOE_EP1 },
      { characterId: 2, label: "Squadmate", revealedAt: IOE_EP1 },
      { characterId: 4, label: "Rival council president", revealedAt: IOE_EP1 },
    ],
    sources: [SRC.aniFanWiki, SRC.aniWirePremiere, SRC.yalEp1, SRC.yalEp2, SRC.yalEp3],
  },
  {
    id: 2,
    slug: "Abigail_June",
    name: "Abigail June",
    role: "Female protagonist",
    visibleFrom: IOE_LISTED,
    bio: [
      {
        text: "One of Sora's allies inside Planetation.",
        revealedAt: null,
      },
      {
        text: "Plays under the in-game name Saturn12 and wields the Flame Guns: dual machine guns with a grapple line and jet pack. She lands the finisher on YAMAGA284, a cut fans broke down frame by frame.",
        revealedAt: IOE_EP1,
      },
      {
        text: "Wears a blue necklace pendant she instinctively reaches for mid-fight. Deadpan, loyal and the squad's sharpest comedic timing.",
        revealedAt: IOE_EP1,
      },
      {
        text: "Determined to see her arch-rival, Miyuki Kagemitsu, change into a better person.",
        revealedAt: IOE_EP1,
      },
      {
        text: "Escapes a jail cell alongside Grayson after a run-in with a security officer.",
        revealedAt: IOE_EP2,
      },
      {
        text: "Clashes with Miyuki in the Battle Circle, revealing six years of history between them.",
        revealedAt: IOE_EP3,
      },
    ],
    relationships: [
      { characterId: 1, label: "Squadmate", revealedAt: IOE_EP1 },
      { characterId: 3, label: "Squadmate", revealedAt: IOE_EP1 },
      { characterId: 5, label: "Squadmate", revealedAt: IOE_EP1 },
      { characterId: 4, label: "Arch-rival", revealedAt: IOE_EP1 },
    ],
    sources: [SRC.aniFanWiki, SRC.aniWirePremiere, SRC.yalEp1, SRC.yalEp2, SRC.yalEp3],
  },
  {
    id: 3,
    slug: "Grayson_Rothenberg",
    name: "Grayson Rothenberg",
    role: "Main character",
    visibleFrom: IOE_LISTED,
    bio: [
      {
        text: "One of Sora's allies inside Planetation.",
        revealedAt: null,
      },
      {
        text: "Talented and cool. Usually easygoing, but intense when it comes to duty. Wields the Crucible Dual Blades: remote-controlled flying greatswords with an IGNITION mode.",
        revealedAt: IOE_EP1,
      },
      {
        text: "Drives a golf cart at 90mph and works out that Frontier Risk Management is a corporate military contractor almost instantly.",
        revealedAt: IOE_EP2,
      },
      {
        text: "Defeats IgniteCOD_Clutch with grounded boxing jabs and street kicks, finishing with Lethal Crucible: Red Divide.",
        revealedAt: IOE_EP3,
      },
    ],
    relationships: [
      { characterId: 1, label: "Squadmate", revealedAt: IOE_EP1 },
      { characterId: 2, label: "Squadmate", revealedAt: IOE_EP1 },
      { characterId: 5, label: "Squadmate", revealedAt: IOE_EP1 },
    ],
    sources: [SRC.aniFanWiki, SRC.yalEp1, SRC.yalEp2, SRC.yalEp3],
  },
  {
    id: 4,
    slug: "Miyuki_Kagemitsu",
    name: "Miyuki Kagemitsu",
    role: "Hammond Council 1 President",
    visibleFrom: IOE_LISTED,
    bio: [
      {
        text: "President of the student council that runs the system from above.",
        revealedAt: null,
      },
      {
        text: "Leads Hammond Council 1, a coordinated five-member squad, and wields Zantetsuken. Her authority comes from stillness rather than volume.",
        revealedAt: IOE_EP1,
      },
      {
        text: "Delivers the \"No fear, no hesitation, no regrets\" lobby speech before choosing Void Rift, ending with \"Therefore, our choice towards history is REFUSAL!\"",
        revealedAt: IOE_EP1,
      },
      {
        text: "Duels Abigail in the Battle Circle. For the first time, her composure visibly breaks.",
        revealedAt: IOE_EP3,
      },
    ],
    relationships: [
      { characterId: 6, label: "Vice President", revealedAt: IOE_EP1 },
      { characterId: 7, label: "Secretary", revealedAt: IOE_EP1 },
      { characterId: 8, label: "Supervisor", revealedAt: IOE_EP1 },
      { characterId: 9, label: "Advisor", revealedAt: IOE_EP1 },
      { characterId: 2, label: "Arch-rival", revealedAt: IOE_EP1 },
    ],
    sources: [SRC.aniFanWiki, SRC.aniWirePremiere, SRC.yalEp1, SRC.yalEp3],
  },
  {
    id: 5,
    slug: "Ben_Smythe",
    name: "Ben Smythe",
    role: "Main character",
    visibleFrom: IOE_LISTED,
    bio: [
      { text: "One of Sora's allies inside Planetation.", revealedAt: null },
      {
        text: "Strives to live with zero fear, no regrets, and total freedom. Disables his NodeCore's safety governors within 30 seconds of receiving it.",
        revealedAt: IOE_EP1,
      },
      {
        text: "Rides the roof of a moving golf cart to fire on a giant wheel monster, then makes the NodeCore drop-in.",
        revealedAt: IOE_EP2,
      },
      {
        text: "Wins a demolition duel against Maxino by charging straight through a point-blank blast: \"HERE'S YOUR L!\"",
        revealedAt: IOE_EP3,
      },
    ],
    relationships: [
      { characterId: 1, label: "Squadmate", revealedAt: IOE_EP1 },
      { characterId: 2, label: "Squadmate", revealedAt: IOE_EP1 },
      { characterId: 3, label: "Squadmate", revealedAt: IOE_EP1 },
    ],
    sources: [SRC.aniFanWiki, SRC.yalEp1, SRC.yalEp2, SRC.yalEp3],
  },
  {
    id: 6,
    slug: "Echo_Desmond",
    name: "Echo Desmond",
    role: "Hammond Council 1 Vice President",
    visibleFrom: IOE_EP1,
    bio: [
      { text: "Vice President of Hammond Council 1 and a dual-blade combatant with a parkour-heavy fighting style.", revealedAt: IOE_EP1 },
      { text: "Faces Lisa in the Battle Circle.", revealedAt: IOE_EP3 },
    ],
    relationships: [{ characterId: 4, label: "Council President", revealedAt: IOE_EP1 }],
    sources: [SRC.aniFanWiki, SRC.aniWirePremiere, SRC.yalEp3],
  },
  {
    id: 7,
    slug: "Likko_Valenne",
    name: "Likko Valenne",
    role: "Hammond Council 1 Secretary",
    visibleFrom: IOE_EP1,
    bio: [
      { text: "Secretary of Hammond Council 1 and a shotgun combatant. Her lobby emote dance, copied by five individually animated NPCs, is the episode's most elaborate comedy beat.", revealedAt: IOE_EP1 },
      { text: "Faces Minko in the Battle Circle.", revealedAt: IOE_EP3 },
    ],
    relationships: [{ characterId: 4, label: "Council President", revealedAt: IOE_EP1 }],
    sources: [SRC.aniFanWiki, SRC.aniWirePremiere, SRC.yalEp3],
  },
  {
    id: 8,
    slug: "William_Jones",
    name: "William Jones",
    role: "Hammond Council 1 Supervisor",
    visibleFrom: IOE_EP1,
    bio: [{ text: "Supervisor of Hammond Council 1.", revealedAt: IOE_EP1 }],
    relationships: [{ characterId: 4, label: "Council President", revealedAt: IOE_EP1 }],
    sources: [SRC.aniFanWiki],
  },
  {
    id: 9,
    slug: "Kieran_Atsushi",
    name: "Kieran Atsushi",
    role: "Hammond Council 1 Advisor",
    visibleFrom: IOE_EP1,
    bio: [{ text: "Advisor of Hammond Council 1.", revealedAt: IOE_EP1 }],
    relationships: [{ characterId: 4, label: "Council President", revealedAt: IOE_EP1 }],
    sources: [SRC.aniFanWiki],
  },
  {
    id: 10,
    slug: "Nova",
    name: "Nova",
    role: "KO Operations senior operator",
    visibleFrom: IOE_EP1,
    bio: [
      { text: "Senior operator and effective office manager at KO Operations headquarters, the organization that oversees Planetation's infrastructure.", revealedAt: IOE_EP1 },
      { text: "Watches the player counter tick down (\"Currently the amount is 9,994\") and closes the scene with a quiet \"It's over.\"", revealedAt: IOE_EP1 },
    ],
    relationships: [{ characterId: 11, label: "Supervisor", revealedAt: IOE_EP1 }],
    sources: [SRC.aniFanWiki, SRC.aniWirePremiere, SRC.yalEp1],
  },
  {
    id: 11,
    slug: "Gamlet",
    name: "Gamlet",
    role: "KO Operations director",
    visibleFrom: IOE_EP1,
    bio: [
      { text: "Director of KO Operations and Nova's nominal supervisor. Fond of honey in his coffee and small bets.", revealedAt: IOE_EP1 },
    ],
    relationships: [{ characterId: 10, label: "Senior operator", revealedAt: IOE_EP1 }],
    sources: [SRC.aniFanWiki, SRC.yalEp1],
  },
  {
    id: 12,
    slug: "Michael_Pentulengro",
    name: "Michael Pentulengro",
    role: "KO Operations operator",
    visibleFrom: IOE_EP1,
    bio: [{ text: "Operator at KO Operations.", revealedAt: IOE_EP1 }],
    relationships: [],
    sources: [SRC.aniFanWiki],
  },
  {
    id: 13,
    slug: "Andreas_Walker",
    name: "Andreas Walker",
    role: "KO Operations operator",
    visibleFrom: IOE_EP1,
    bio: [{ text: "Operator at KO Operations.", revealedAt: IOE_EP1 }],
    relationships: [],
    sources: [SRC.aniFanWiki],
  },
];

export const allCharacters: Character[] = [...ioeCharacters.map((c) => ({ ...c, phase: IOE_PHASE })), ...catalogueCharacters];
export const characters: Character[] = active(allCharacters);
