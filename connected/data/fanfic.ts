// InkPocket: a fan fiction archive. Stories are written by fans of the
// Connected Era's original manga and games, and each chapter appears on
// its posting date.

export const INKPOCKET_HOST = "inkpocket.connectedera.local";

export interface Fandom {
  id: string;
  name: string;
  kind: "Manga" | "Game" | "Crossover";
  /** Where the original lives. */
  sourceUrl: string;
  /** The fandom exists once its original has come out. */
  since: string;
}

export interface FicChapter {
  title: string;
  at: string;
  text: string;
}

export interface ArchiveStory {
  id: string;
  title: string;
  author: string;
  fandom: string;
  rating: "Everyone" | "Teen";
  genres: string[];
  summary: string;
  complete: boolean;
  chapters: FicChapter[];
  baseFavorites: number;
}

export interface ArchiveReview {
  storyId: string;
  chapter: number;
  name: string;
  text: string;
  at: string;
}

export const fandoms: Fandom[] = [
  { id: "lantern-street-couriers", name: "Lantern Street Couriers", kind: "Manga", sourceUrl: "http://manga.connectedera.local/manga/lantern-street-couriers", since: "2012-08-03T03:00:00Z" },
  { id: "paper-planet", name: "Paper Planet", kind: "Manga", sourceUrl: "http://manga.connectedera.local/manga/paper-planet", since: "2013-01-11T03:00:00Z" },
  { id: "moonlit-bakery", name: "Moonlit Bakery", kind: "Manga", sourceUrl: "http://manga.connectedera.local/manga/moonlit-bakery", since: "2013-06-20T03:00:00Z" },
  { id: "star-courier", name: "Star Courier", kind: "Game", sourceUrl: "http://freewarecorner.connectedera.local/games/star-courier", since: "2012-11-20T15:00:00Z" },
  { id: "crossover", name: "Crossovers", kind: "Crossover", sourceUrl: "http://manga.connectedera.local/", since: "2009-05-01T00:00:00Z" },
];

export const archiveStories: ArchiveStory[] = [
  {
    id: "fic_longway",
    title: "The Long Way Up",
    author: "rooftop_runner",
    fandom: "lantern-street-couriers",
    rating: "Everyone",
    genres: ["Adventure", "Friendship"],
    summary: "Mei's first week as a courier, one staircase at a time. Set right after chapter 1.",
    complete: true,
    baseFavorites: 48,
    chapters: [
      {
        title: "Stairs, Again",
        at: "2012-08-20T22:00:00Z",
        text: `The clock tower had two hundred steps. Mei knew because she had counted them on Monday, and again on Tuesday, and on Wednesday she had stopped counting and started humming instead.

"You could take the lift," said the old caretaker, who said this every morning.

"Couriers don't take lifts," said Mei, who had decided this on Monday and was now too proud to change her mind.

The parcel today was small and square and smelled faintly of oranges. The label said ITO CLOCKWORKS, TOP FLOOR, PLEASE KNOCK TWICE in very careful handwriting. Mei tucked it into her satchel, tightened her scarf and began.

By step fifty she was thinking about lunch. By step one hundred she was thinking about melon bread specifically. By step one hundred and fifty she had invented a song about melon bread, and by step two hundred she had finished the second verse.

She knocked twice.

The door opened on the workshop full of clocks, all ticking slightly out of time with each other, and the big old clock in the middle singing its little tune on the hour, the way it had since Monday. Ito took the parcel in both hands as if it were made of glass.

"Oranges, from my sister," said Ito. "She sends them every summer. Would you like one?"

Mei sat on the windowsill with an orange and looked down at Lantern Street, all its lamps just starting to glow. From up here the street looked like a necklace.

"Same time tomorrow?" asked Ito.

"Every day, if there's a parcel," said Mei, and meant it.`,
      },
      {
        title: "The Rival's Map",
        at: "2012-09-15T21:30:00Z",
        text: `Ren had a map. Of course Ren had a map.

It was drawn in four colours and covered every rooftop between the bakery and the river, with little arrows showing which gutters were safe to walk along and which ones creaked. He unrolled it on the bakery counter with the air of a Swift Wind courier revealing treasure.

"Shortcut," he said. "Saves eleven minutes to the post office."

"Shortcuts are cheating," said Mei.

"Shortcuts are efficient."

"Then why are you showing me?"

Ren rolled the map back up, rather too quickly. "No reason."

The baker, who had been listening the whole time, slid two warm melon breads across the counter. "He's showing you," she said, "because he got lost on the Fishmonger's roof yesterday and wants someone to check his arrows."

Ren went the colour of a postbox.

So they checked the arrows together that afternoon. Two of them were wrong, one gutter was much creakier than advertised, and the Fishmonger's roof turned out to have a very territorial seagull. But by sunset the map was correct, and somewhere along the way it had stopped being Ren's map and started being theirs.

"Eleven minutes," said Mei, out of breath, on the post office steps.

"Twelve," said Ren. "The seagull cost us one."

They split the last melon bread.`,
      },
    ],
  },
  {
    id: "fic_melonbread",
    title: "Melon Bread Diplomacy",
    author: "nadia_writes",
    fandom: "lantern-street-couriers",
    rating: "Everyone",
    genres: ["Humor", "Slice of Life"],
    summary: "Two bakeries, one street, and a courier caught in the middle. One-shot.",
    complete: true,
    baseFavorites: 31,
    chapters: [
      {
        title: "Melon Bread Diplomacy",
        at: "2012-10-05T23:00:00Z",
        text: `There were two bakeries on Lantern Street, and they had not spoken to each other in nine years.

Nobody remembered why. The baker at the north end said it was about a recipe. The baker at the south end said it was about a parking space. Mrs. Ota from the flower shop said it was about a hat, and refused to elaborate.

Mei did not care about any of this until the morning she was handed two parcels: one from the north bakery, addressed to the south bakery, and one from the south bakery, addressed to the north.

She stood in the middle of the street, holding both, and thought very hard.

Then she swapped the labels back to front, so each parcel said who it was from in big letters, and delivered them at exactly the same moment by running very fast between the two shops.

Inside each parcel was a melon bread.

It turned out that both bakers had, on the same night, decided they were tired of not speaking. It turned out they had each baked their very best melon bread as an apology. It turned out, after some careful tasting in the middle of the street, that the north baker's crust was better but the south baker's filling was better, and that this was clearly something they needed to discuss. At length. Over tea.

Mei got paid twice and was given a melon bread from each shop, which she considered fair.

Mrs. Ota still says it was about a hat.`,
      },
    ],
  },
  {
    id: "fic_pipbreakfast",
    title: "Pip's First Breakfast",
    author: "foldedstar",
    fandom: "paper-planet",
    rating: "Everyone",
    genres: ["Humor", "Family"],
    summary: "Pip would like to find home. Preferably after breakfast. But what does a paper planet eat?",
    complete: false,
    baseFavorites: 57,
    chapters: [
      {
        title: "A Question of Cereal",
        at: "2013-01-25T20:00:00Z",
        text: `"What do planets eat?" asked Taro.

Pip floated over the kitchen table, slowly rotating, which Taro was learning meant Pip was thinking.

"Stardust," Pip said eventually. "Comets, sometimes. Light from very old suns."

Taro looked in the cupboard. "We have cornflakes."

Pip drifted down and inspected the box with great seriousness. A cornflake was carefully lifted, turned over, and examined from every angle.

"It's very flat," said Pip.

"So are you, sort of. You're made of paper."

"I am a sphere," said Pip, offended, and then, after a pause: "A folded sphere. Which is different."

They tried the cornflakes. Pip absorbed one with a small papery crinkle and went quiet for a long moment.

"Well?" asked Taro.

"It tastes," said Pip slowly, "like a sunny morning on a planet with very good weather."

Taro's little sister came downstairs in her pyjamas, looked at her brother and a small chatty planet sharing a bowl of cornflakes, and went back to bed, deciding wisely that it was too early in the day for questions.`,
      },
      {
        title: "Pip Tries Toast",
        at: "2013-02-14T20:00:00Z",
        text: `Toast was a disaster.

Not because Pip didn't like it. Pip loved it. The problem was the crumbs, which Pip's gentle gravity pulled into a slow, glittering orbit, so that by the end of breakfast Pip had a second ring, just inside the first.

"Like Saturn," said Taro, impressed. They had done the rings of Saturn at school that week.

"Saturn only has one kind of ring," said Pip, who had been listening in while Taro did his homework, and turned slowly to admire both rings in the reflection all the same.

Taro's sister came in, saw the new ring, saw the toaster, and poured herself some juice without a word. She was getting good at that.

By lunchtime the crumbs had settled onto the windowsill, where three sparrows were extremely grateful. Pip watched them through the glass.

"Do you think," said Pip, "that on my planet, someone is making toast right now?"

Taro thought about it. "Probably. Everyone likes toast."

Pip seemed satisfied with that, and spent the rest of the afternoon practising making rings on purpose.`,
      },
    ],
  },
  {
    id: "fic_nightshift",
    title: "Night Shift",
    author: "crumbcake",
    fandom: "moonlit-bakery",
    rating: "Everyone",
    genres: ["Fantasy", "Friendship"],
    summary: "The rabbit-eared visitor comes back the next month. This time she brings friends.",
    complete: true,
    baseFavorites: 22,
    chapters: [
      {
        title: "Night Shift",
        at: "2013-07-02T23:30:00Z",
        text: `Hina had stopped expecting her midnight visitor, which was exactly why she came back.

The bell over the door gave its small bright ring at five past twelve. The rabbit ears appeared first, then the rest of her, then, to Hina's surprise, two more pairs of ears behind her, belonging to two smaller visitors holding hands.

"My cousins," said the visitor. "I told them about the moon bread. They didn't believe me."

The cousins were very polite and very quiet and stared at the bread shelves with enormous eyes.

Hina had not made moon bread that night. She made it now, all four of them watching the oven window together as the loaves rose, round and pale and faintly glowing at the edges the way only moon bread does.

The cousins ate theirs in tiny careful bites. The visitor ate hers in large happy ones. Nobody said very much, and nobody needed to.

When they left, the visitor turned in the doorway.

"Next month," she said, "there are more cousins."

Hina looked at her flour, her oven and her small, warm, once-empty bakery, and started planning a bigger batch.`,
      },
    ],
  },
  {
    id: "fic_returntosender",
    title: "Return to Sender",
    author: "pixelpilot_fan",
    fandom: "star-courier",
    rating: "Everyone",
    genres: ["Adventure", "Humor"],
    summary: "Every courier knows about the Rock Crab. Nobody ever asked why it guards level 4.",
    complete: true,
    baseFavorites: 64,
    chapters: [
      {
        title: "Express Delivery",
        at: "2012-12-08T19:00:00Z",
        text: `Courier 7 had made three hundred deliveries through the asteroid field without a scratch, which was a record, and a little bit of a brag.

"Watch the blue rocks," said Dispatch over the radio, the way Dispatch always did. "They're slow, but they're big."

"I know about the blue rocks."

"And the Rock Crab."

"Everyone knows about the Rock Crab."

The parcels came tumbling out of the dark like they always did, little brown boxes tied with red string, each one glinting in the starlight. Courier 7 swooped low to catch the first, rolled under a grey rock to catch the second, and tucked in behind a big lazy blue one just as a shower of pebbles went past.

Eight parcels. Level complete. Then eight more. Then eight more.

And then the radio crackled, and Dispatch said, a little nervously, "Level 4."

The asteroid field opened up into a wide quiet space, and in the middle of it, enormous and craggy and blinking its two round eyes, sat the Rock Crab.

It looked at Courier 7.

Courier 7 looked at it.

"Hello," said Courier 7, because it seemed polite.`,
      },
      {
        title: "The Crab Who Wanted Mail",
        at: "2013-03-10T19:00:00Z",
        text: `The thing about the Rock Crab, it turned out, was that it had never once received a parcel.

Couriers flew past it every day. Parcels went everywhere: to moons, to stations, to tiny lighthouses on the edges of nebulas. But nobody ever addressed anything to a crab made of rock, and so the crab sat in the middle of level 4, watching everyone else's mail go by, and grumbled. The grumbling came out as red sparks. The red sparks were, admittedly, a problem.

Courier 7 worked this out somewhere around the third dodge.

"Dispatch," Courier 7 said, "do we have any parcels without an address?"

There was a long pause on the radio. "...We have a lot of those, actually."

So Courier 7 started delivering them. One parcel. Then another. Each one sailed across the gap and landed with a soft bump against the Rock Crab's shell, and each time, the crab's eyes went a little rounder and the sparks came a little slower.

By the eighth parcel the sparks had stopped completely. The Rock Crab was sitting very still, surrounded by little brown boxes, carefully untying a red string with one enormous claw.

Inside was a postcard of a sunny beach.

The crab looked at it for a long time.

These days, level 4 is the quietest stretch in the whole field. Couriers wave as they pass. And once a week, without fail, someone drops off a parcel addressed, in large careful letters, to THE ROCK CRAB, LEVEL 4.`,
      },
    ],
  },
  {
    id: "fic_lanternspaper",
    title: "Lanterns and Paper",
    author: "rooftop_runner",
    fandom: "crossover",
    rating: "Everyone",
    genres: ["Crossover", "Friendship"],
    summary: "Lantern Street Couriers x Paper Planet. Mei gets a delivery for a boy named Taro. The parcel is humming.",
    complete: false,
    baseFavorites: 19,
    chapters: [
      {
        title: "Fragile, Handle with Care",
        at: "2013-11-15T21:00:00Z",
        text: `The parcel was humming.

Mei held it at arm's length on the doorstep. It was wrapped in brown paper and string like any other parcel, and it was addressed in neat handwriting to TARO, 3RD FLOOR, and it was, unmistakably, humming a tune.

She knocked twice, out of habit.

A boy opened the door, and behind him, floating at about head height, was a small round paper planet, rotating gently and looking extremely interested.

"Parcel for Taro," said Mei, because a courier is a courier no matter what.

"That's me," said the boy. The planet drifted closer to the parcel, and the humming got louder, and then the planet started humming too, in harmony.

"It's from my grandpa," Taro said, carefully untying the string. "He said he found something that might help Pip get home."

Inside, nested in tissue paper, was a single folded paper star. It was singing.

Pip went very still.

"That," said Pip, in a small voice, "is a song from my sky."

Mei, who had delivered oranges and melon bread and once, memorably, a very cross goose, decided that this was the best delivery she had ever made. She sat down on the step, because she suspected this was going to be a long story, and she wanted to hear all of it.`,
      },
    ],
  },
];

export const archiveReviews: ArchiveReview[] = [
  { storyId: "fic_longway", chapter: 1, name: "OtakuOlivia", text: "The orange lady!! I'm so happy. This feels exactly like the manga.", at: "2012-08-21T01:00:00Z" },
  { storyId: "fic_longway", chapter: 1, name: "skyblue_kid", text: "the melon bread song lol", at: "2012-08-22T18:00:00Z" },
  { storyId: "fic_longway", chapter: 2, name: "nadia_writes", text: "Ren going the colour of a postbox. Perfect. The seagull deserves its own story.", at: "2012-09-16T12:00:00Z" },
  { storyId: "fic_melonbread", chapter: 1, name: "rooftop_runner", text: "\"Mrs. Ota still says it was about a hat.\" I laughed out loud.", at: "2012-10-06T15:00:00Z" },
  { storyId: "fic_pipbreakfast", chapter: 1, name: "OtakuOlivia", text: "\"I am a sphere.\" Pip is perfect, you captured them so well.", at: "2013-01-26T02:00:00Z" },
  { storyId: "fic_pipbreakfast", chapter: 2, name: "crumbcake", text: "A second ring made of toast crumbs! The sparrows getting lunch made me smile.", at: "2013-02-15T09:00:00Z" },
  { storyId: "fic_nightshift", chapter: 1, name: "foldedstar", text: "So gentle and cosy. More cousins next month please!", at: "2013-07-03T10:00:00Z" },
  { storyId: "fic_returntosender", chapter: 1, name: "PixelPilot", text: "As someone who has fought this crab many, many times: I need to know what happens.", at: "2012-12-09T11:00:00Z" },
  { storyId: "fic_returntosender", chapter: 2, name: "PixelPilot", text: "I will never be able to fight the Rock Crab normally again. This is canon now.", at: "2013-03-11T12:00:00Z" },
  { storyId: "fic_returntosender", chapter: 2, name: "skyblue_kid", text: "THE POSTCARD", at: "2013-03-11T20:00:00Z" },
  { storyId: "fic_lanternspaper", chapter: 1, name: "foldedstar", text: "Mei meeting Pip is everything I wanted. A singing star!", at: "2013-11-16T13:00:00Z" },
];

export const storyById = (id: string) => archiveStories.find((s) => s.id === id);
export const fandomById = (id: string) => fandoms.find((f) => f.id === id);
export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
