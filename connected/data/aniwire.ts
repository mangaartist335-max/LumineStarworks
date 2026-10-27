// AniWire: anime news, features, reviews and interviews. Facts about shows
// come from data/catalogue.ts (the Master Bible); the writers, readers and
// the interview with MeTube's AnimeTalkTuesday are the Connected Era's own.
// Articles appear on their publication date, corrections on the date they
// were made, and reader comments on the date they were posted.

import { HOST } from "@/lib/web/hosts";
import { mediaUrl } from "./media";

export const ANIWIRE_HOST = HOST.aniwire;

export type ArticleKind = "News" | "Feature" | "Review" | "Interview";

export interface Article {
  id: string;
  slug: string;
  kind: ArticleKind;
  title: string;
  dek: string;
  author: string;
  publishedAt: string;
  image?: string;
  /** Paragraphs. Interview questions start with "Q: ". */
  body: string[];
  tags: string[];
  /** Catalogue slugs, or "iron-to-requiem". */
  related: string[];
  corrections?: { at: string; text: string }[];
  comments?: { at: string; name: string; text: string }[];
}

export const writers: Record<string, string> = {
  "Mika Hollins": "News editor. Has watched every Flow Pictures opening at least twice.",
  "Dev Okafor": "Reviews. Will talk about soundtracks for as long as you let him.",
  "Sam Reyes": "Features and interviews. Collects old season charts.",
};

export const articles: Article[] = [
  {
    id: "aw_sinful_apex_wraps",
    slug: "sinful-apex-wraps-24-episode-run",
    kind: "News",
    title: "Sinful Apex wraps its 24-episode run",
    dek: "Flow Pictures' final marquee production signs off after five months of Monday nights.",
    author: "Mika Hollins",
    publishedAt: "2012-01-24T02:00:00Z",
    image: mediaUrl("video-thumb:sinful-apex-review"),
    body: [
      "Sinful Apex aired its 24th and final episode on Monday, January 23, closing a run that began on August 15, 2011.",
      "The series is Flow Pictures' final marquee production. Kaihatsu Miura directed, with Lio Haraguchi on characters and animation, Yusuke Kagura on fight choreography and Mirai Kanzaki on colour design.",
      "Singer LUNE, who has sung for several Flow Pictures productions, appeared in the series as the singer Aria Moonbirth.",
      "Congratulations to everyone involved on a lovely five months!",
    ],
    tags: ["Sinful Apex", "Flow Pictures", "Kaihatsu Miura", "LUNE"],
    related: ["sinful-apex"],
    comments: [
      { at: "2012-01-24T03:10:00Z", name: "mondaynightmarathon", text: "My Monday nights feel so empty now. What a show though!" },
      { at: "2012-01-24T09:45:00Z", name: "pixel_sunrise", text: "LUNE as Aria was the best surprise of the season." },
    ],
  },
  {
    id: "aw_staff_spotlight",
    slug: "staff-spotlight-flow-pictures",
    kind: "Feature",
    title: "Staff spotlight: the people behind Flow Pictures' look",
    dek: "Eight names that keep turning up in the credits, and where to find their work.",
    author: "Sam Reyes",
    publishedAt: "2012-02-10T15:00:00Z",
    body: [
      "With Sinful Apex finished, plenty of readers have asked where to go next. Following the staff is a great way in, so here are eight people whose names run through Flow Pictures' catalogue and beyond.",
      "Kaihatsu Miura (director): Skyfall Chronicle, Zero Latitude and Sinful Apex.",
      "Keito Kisaragi (writer and series composition): Steelbound Testament, Pale Garden Reverie and Blizzard Requiem.",
      "Tomoe Suzuhara (storyboards): Vacant Crown: Liminal War, Glass Cathedral and A Mystical Skyline/Finger.",
      "Lio Haraguchi (characters and animation): Destiny/Infinite, Steelbound Testament and Sinful Apex.",
      "Yusuke Kagura (fight choreography): River of Sparks, Ghost Eater and Sinful Apex.",
      "Mirai Kanzaki (colour design): Neon Afterimage and Sinful Apex.",
      "Aoi Tachikaze (sound direction): River of Sparks and Glass Cathedral.",
      "Rento Shibasaki (music): Vacant Crown: Liminal War and Steelbound Testament.",
      "Pick a name, pick a title, and enjoy the rabbit hole.",
    ],
    tags: ["Flow Pictures", "staff", "feature"],
    related: ["skyfall-chronicle", "steelbound-testament", "glass-cathedral", "river-of-sparks", "neon-afterimage", "sinful-apex"],
    comments: [{ at: "2012-02-11T18:20:00Z", name: "sakuga_sunday", text: "Saving this. Kagura's fights in River of Sparks are still some of my favourites." }],
  },
  {
    id: "aw_lune_six_years",
    slug: "lune-six-years-of-songs",
    kind: "Feature",
    title: "LUNE: six years of songs",
    dek: "From a debut at 13 to Aria Moonbirth, a look at an independent singer-songwriter's work so far.",
    author: "Sam Reyes",
    publishedAt: "2012-03-15T14:00:00Z",
    body: [
      "Lena Moonlight, who performs as LUNE, debuted professionally in 2006 at the age of 13. She has stayed independent ever since, writing her own songs, and she has a long-running working relationship with Flow Pictures.",
      "Most recently she appeared in Sinful Apex as the singer Aria Moonbirth.",
      "Here are the songs her name is tied to across the Flow Pictures catalogue: \"Gesshoku / Requiem for Zero\" (Vacant Crown: Liminal War), \"VITRAIL\" (Glass Cathedral), \"AFTER//IMAGE\" (Neon Afterimage), \"PULSE:RE\" (Circuit Hearts: Reload) and \"ALETHEIA / Ashes Know My Name\" (Steelbound Testament).",
      "Which one is your favourite? Tell us in the comments!",
    ],
    tags: ["LUNE", "music", "Flow Pictures"],
    related: ["vacant-crown", "glass-cathedral", "neon-afterimage", "circuit-hearts", "steelbound-testament", "sinful-apex"],
    comments: [
      { at: "2012-03-15T16:02:00Z", name: "rainynight_radio", text: "AFTER//IMAGE forever. Perfect for walking home in the rain." },
      { at: "2012-03-16T10:30:00Z", name: "amv_maker_jo", text: "PULSE:RE! Every AMV I make ends up using it." },
    ],
  },
  {
    id: "aw_interview_animetalk",
    slug: "interview-animetalktuesday",
    kind: "Interview",
    title: "Interview: AnimeTalkTuesday on two years of spoiler-free reviews",
    dek: "MeTube's friendliest anime reviewer on keeping things fun, fair and spoiler-free.",
    author: "Sam Reyes",
    publishedAt: "2012-05-18T13:00:00Z",
    image: mediaUrl("video-thumb:sinful-apex-review"),
    body: [
      "Every Tuesday since early 2010, AnimeTalkTuesday has posted a spoiler-free review or first impression on MeTube. We caught up to talk about how it all works.",
      "Q: Why spoiler-free?",
      "I want people to finish a video and go watch the show. If I spoil the good parts, I've taken something away from them. So I talk about how a show feels, who made it and why it might be your kind of thing.",
      "Q: Your Sinful Apex video did really well. What was it like to make?",
      "Fun, and a little tricky. Everyone wanted to talk about the finale, so the challenge was explaining why it works without saying what happens. I ended up talking about the staff and the pacing instead, and people really liked that.",
      "Q: Any advice for someone starting their own channel?",
      "Pick a day and stick to it. People like knowing when to come back. And be kind in the comments, it makes the whole thing nicer for everyone.",
      "Q: What are you watching for fun right now?",
      "Working my way through older Flow Pictures shows. Glass Cathedral is gorgeous.",
      "You can find AnimeTalkTuesday's reviews on MeTube every Tuesday.",
    ],
    tags: ["interview", "MeTube", "AnimeTalkTuesday", "reviews"],
    related: ["sinful-apex", "glass-cathedral"],
    comments: [{ at: "2012-05-18T19:40:00Z", name: "tuesday_regular", text: "Love this channel. The no-spoilers rule is why I trust it." }],
  },
  {
    id: "aw_flow_catalogue_guide",
    slug: "flow-pictures-catalogue-guide",
    kind: "Feature",
    title: "Back catalogue guide: Flow Pictures, 2000 to 2012",
    dek: "Eighteen titles, oldest first. Grab some snacks.",
    author: "Mika Hollins",
    publishedAt: "2012-08-24T15:00:00Z",
    body: [
      "Flow Pictures' catalogue runs from Vacant Crown: Liminal War in 2000 to this year's Rust Veil Junction and Skyfall Chronicle: Black Aegis. Here is the whole list in order, with a line on what each one is about.",
      "@catalogue",
      "Note: this is a guide to the catalogue, not a list of which studio animated each title. We've only named a studio where it's on the record.",
    ],
    tags: ["Flow Pictures", "guide", "feature"],
    related: ["vacant-crown", "river-of-sparks", "glass-cathedral", "skyfall-chronicle", "steelbound-testament", "sinful-apex", "rust-veil-junction", "black-aegis"],
    corrections: [{ at: "2012-08-25T10:00:00Z", text: "An earlier version of this guide listed Garden of Cinders as a single OVA. It's an OVA trilogy." }],
    comments: [{ at: "2012-08-25T12:15:00Z", name: "citadel_skies", text: "Skyfall Chronicle still holds up. Floating citadels never get old." }],
  },
  {
    id: "aw_2012_in_review",
    slug: "2012-in-review",
    kind: "Feature",
    title: "2012 in review: our favourite moments",
    dek: "A finale, a railway city and a sky war on the big screen.",
    author: "Dev Okafor",
    publishedAt: "2012-12-28T15:00:00Z",
    body: [
      "What a year! Here are the moments that stuck with the AniWire team.",
      "January: Sinful Apex wrapped its 24-episode run, Flow Pictures' final marquee production, with LUNE's turn as Aria Moonbirth a highlight for a lot of you.",
      "Also this year: Rust Veil Junction gave us one cour of rival factions in a steampunk railway city, and Skyfall Chronicle: Black Aegis took the sky war to cinemas as a sequel to the 2006 series.",
      "And all year long: readers kept rediscovering the back catalogue. Our Flow Pictures guide was our most-read feature of the year.",
      "Thanks for reading, and see you in 2013!",
    ],
    tags: ["year in review", "Flow Pictures", "Rust Veil Junction", "Skyfall Chronicle"],
    related: ["sinful-apex", "rust-veil-junction", "black-aegis"],
    comments: [{ at: "2012-12-29T11:00:00Z", name: "pixel_sunrise", text: "Black Aegis on a cinema screen was something else. Happy new year, AniWire!" }],
  },
  {
    id: "aw_itr_premieres",
    slug: "iron-to-requiem-premieres",
    kind: "News",
    title: "Iron to Requiem premieres tonight",
    dek: "CHAOS Home's new series takes over Thursdays, with music by Hiroyuki Sawano.",
    author: "Mika Hollins",
    publishedAt: "2013-04-04T06:00:00Z",
    image: mediaUrl("video-thumb:iron-to-requiem-first-impressions"),
    body: [
      "Iron to Requiem premieres on Thursday, April 4. The CHAOS Home series is planned for 26 episodes, airing every Thursday, with music by Hiroyuki Sawano.",
      "We'll have first impressions next week. Happy watching!",
    ],
    tags: ["Iron to Requiem", "CHAOS Home", "Hiroyuki Sawano", "Spring 2013"],
    related: ["iron-to-requiem"],
    corrections: [{ at: "2013-04-04T09:30:00Z", text: "An earlier version of this article said the series runs for 24 episodes. It is planned for 26." }],
  },
  {
    id: "aw_itr_first_impressions",
    slug: "iron-to-requiem-first-impressions",
    kind: "Review",
    title: "First impressions: Iron to Requiem, episode 1",
    dek: "A confident start, and a soundtrack you'll be humming all week.",
    author: "Dev Okafor",
    publishedAt: "2013-04-08T14:00:00Z",
    body: [
      "Iron to Requiem's first episode is a steady, confident opener. The animation is consistent rather than flashy, which bodes well for a 26-episode run.",
      "The real star so far is Hiroyuki Sawano's music. Big moments feel huge, and the quieter ones have room to breathe.",
      "Verdict so far: very promising. We'll check in again at the halfway point.",
    ],
    tags: ["Iron to Requiem", "first impressions", "review"],
    related: ["iron-to-requiem"],
    comments: [{ at: "2013-04-08T20:10:00Z", name: "thursday_club", text: "That soundtrack! Thursdays are booked until September." }],
  },
  {
    id: "aw_itr_finale",
    slug: "iron-to-requiem-finishes-first-season",
    kind: "News",
    title: "Iron to Requiem finishes its 26-episode first season",
    dek: "Twenty-six Thursdays later, CHAOS Home's series wraps up.",
    author: "Mika Hollins",
    publishedAt: "2013-09-27T02:00:00Z",
    body: [
      "Iron to Requiem aired the final episode of its first season on Thursday, September 26, completing a 26-episode run that began on April 4.",
      "Thanks to everyone who watched along with us every week!",
    ],
    tags: ["Iron to Requiem", "CHAOS Home"],
    related: ["iron-to-requiem"],
    comments: [{ at: "2013-09-27T08:30:00Z", name: "thursday_club", text: "What a ride. Already rewatching from episode 1." }],
  },
  {
    id: "aw_sinful_apex_bluray_announce",
    slug: "sinful-apex-complete-collection-announced",
    kind: "News",
    title: "Sinful Apex Complete Collection coming to Blu-ray on November 19",
    dek: "Funmaxation brings all 24 episodes home.",
    author: "Mika Hollins",
    publishedAt: "2013-10-06T15:00:00Z",
    body: ["Funmaxation is releasing Sinful Apex: Complete Collection on Blu-ray on November 19. The set collects all 24 episodes of Flow Pictures' final marquee production."],
    tags: ["Sinful Apex", "Funmaxation", "Blu-ray"],
    related: ["sinful-apex"],
  },
  {
    id: "aw_sinful_apex_bluray_out",
    slug: "sinful-apex-complete-collection-out-today",
    kind: "News",
    title: "Out today: Sinful Apex Complete Collection on Blu-ray",
    dek: "A perfect excuse for a rewatch.",
    author: "Mika Hollins",
    publishedAt: "2013-11-19T15:00:00Z",
    body: ["Funmaxation's Sinful Apex: Complete Collection is out on Blu-ray today, with all 24 episodes. Time to clear a weekend!"],
    tags: ["Sinful Apex", "Funmaxation", "Blu-ray"],
    related: ["sinful-apex"],
    comments: [{ at: "2013-11-20T10:00:00Z", name: "mondaynightmarathon", text: "Mine arrived this morning. Monday nights are back!" }],
  },
];

export const articleBySlug = (slug: string) => articles.find((a) => a.slug === slug);
