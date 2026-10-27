// Small archive websites served from data: software, recipes and webmail.
// Every page is dated and only exists from its publication time onward.

export type Block =
  | { kind: "h"; text: string }
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[]; ordered?: boolean }
  | { kind: "action"; label: string; action: "install-game" | "open-app" | "link"; target: string; note?: string };

export interface StaticPage {
  path: string;
  title: string;
  summary: string;
  publishedAt: string;
  tags: string[];
  blocks: Block[];
}

export interface StaticSite {
  host: string;
  name: string;
  tagline: string;
  theme: { bg: string; header: string; headerText: string; accent: string; font: string };
  nav: { label: string; path: string }[];
  pages: StaticPage[];
}

export const staticSites: StaticSite[] = [
  {
    host: "freewarecorner.connectedera.local",
    name: "Freeware Corner",
    tagline: "Free, friendly software for your PC since 2004",
    theme: { bg: "#eef3e6", header: "#2f6b2f", headerText: "#ffffff", accent: "#2f6b2f", font: "Verdana, Geneva, sans-serif" },
    nav: [
      { label: "Home", path: "/" },
      { label: "Games", path: "/games" },
      { label: "Software", path: "/software" },
      { label: "About", path: "/about" },
    ],
    pages: [
      {
        path: "/",
        title: "Freeware Corner",
        summary: "Free games and software for your PC, tested by real people. No toolbars, no nonsense.",
        publishedAt: "2004-05-01T00:00:00Z",
        tags: ["freeware", "software", "download", "free games"],
        blocks: [
          { kind: "p", text: "Welcome! Every program here is free and checked by our volunteers. Pick a category to get started." },
          { kind: "h", text: "Popular this month" },
          { kind: "action", label: "Star Courier (arcade game)", action: "link", target: "/games/star-courier", note: "Dodge asteroids and deliver parcels. Five achievements to unlock!" },
          { kind: "action", label: "Field Sweeper (puzzle game)", action: "link", target: "/games/field-sweeper", note: "The classic grid puzzle, with thistles." },
          { kind: "action", label: "Free wallpaper collections", action: "link", target: "/software/wallpapers", note: "Our favourite places to find desktop backgrounds." },
        ],
      },
      {
        path: "/games",
        title: "Free Games",
        summary: "Free PC games: arcade, puzzle and more.",
        publishedAt: "2004-05-01T00:00:00Z",
        tags: ["free games", "pc games", "download"],
        blocks: [
          { kind: "action", label: "Star Courier", action: "link", target: "/games/star-courier", note: "Arcade - Tinybolt Games - released November 2012" },
          { kind: "action", label: "Field Sweeper", action: "link", target: "/games/field-sweeper", note: "Puzzle - Connected Games - comes with every Connected PC" },
        ],
      },
      {
        path: "/games/star-courier",
        title: "Star Courier - Free Arcade Game",
        summary: "Star Courier by Tinybolt Games: fly parcels through an asteroid field, collect every package and beat the level 4 boss. Free download.",
        publishedAt: "2012-11-20T15:00:00Z",
        tags: ["star courier", "arcade", "game", "free", "tinybolt games", "download"],
        blocks: [
          { kind: "p", text: "Star Courier is a cheerful little arcade game from Tinybolt Games. You're a courier pilot delivering parcels across an asteroid field. Collect every package, use the slow blue rocks as cover and survive the boss on level 4." },
          { kind: "list", items: ["Developer: Tinybolt Games", "Released: November 20, 2012", "Genre: Arcade", "Controls: arrow keys or WASD, P to pause", "Saves your high scores and achievements"] },
          { kind: "action", label: "Install with Connected Games", action: "install-game", target: "game_star_courier", note: "Adds Star Courier to the Games program on your PC." },
          { kind: "p", text: "Stuck on level 3? PixelPilotGaming has a great walkthrough series on MeTube." },
        ],
      },
      {
        path: "/games/field-sweeper",
        title: "Field Sweeper - Classic Puzzle",
        summary: "Field Sweeper: clear the field without stepping on a hidden thistle. Comes free with every Connected PC.",
        publishedAt: "2009-10-22T12:00:00Z",
        tags: ["field sweeper", "puzzle", "game", "free"],
        blocks: [
          { kind: "p", text: "Field Sweeper comes with every Connected PC. Numbers show how many hidden thistles touch each square; right-click to flag the ones you've found." },
          { kind: "action", label: "Open Field Sweeper", action: "install-game", target: "game_field_sweeper", note: "Already installed on your computer." },
        ],
      },
      {
        path: "/software",
        title: "Free Software",
        summary: "Useful free software and add-ons.",
        publishedAt: "2004-05-01T00:00:00Z",
        tags: ["software", "free", "download", "utilities"],
        blocks: [
          { kind: "action", label: "Messenger (built into Connected PCs)", action: "link", target: "/software/messenger", note: "Chat with friends, share links and set a status." },
          { kind: "action", label: "Wallpaper collections", action: "link", target: "/software/wallpapers", note: "Where to find free backgrounds." },
        ],
      },
      {
        path: "/software/messenger",
        title: "Messenger - Chat With Friends",
        summary: "Messenger comes with Connected PCs: contacts, status messages, emoticons, group chats and link sharing.",
        publishedAt: "2012-06-12T12:00:00Z",
        tags: ["messenger", "chat", "instant messaging", "software"],
        blocks: [
          { kind: "p", text: "Good news: Messenger is already on your Connected PC. Set your status, add a custom message, start group chats and paste links to share them." },
          { kind: "action", label: "Open Messenger", action: "open-app", target: "messenger" },
        ],
      },
      {
        path: "/software/wallpapers",
        title: "Free Wallpaper Collections",
        summary: "Our picks for free desktop wallpapers, all fine for personal use.",
        publishedAt: "2011-02-14T12:00:00Z",
        tags: ["wallpaper", "backgrounds", "free"],
        blocks: [
          { kind: "p", text: "WallpaperGarden is our favourite: original artwork, free for personal desktop use, in proper HD sizes." },
          { kind: "action", label: "Visit WallpaperGarden", action: "link", target: "http://wallpapers.connectedera.local/" },
        ],
      },
      {
        path: "/about",
        title: "About Freeware Corner",
        summary: "A small team of volunteers testing free software since 2004.",
        publishedAt: "2004-05-01T00:00:00Z",
        tags: ["about", "freeware corner"],
        blocks: [{ kind: "p", text: "We're a handful of volunteers who love finding good free software. Every program is installed and tried by at least two of us before it goes up. Say hi on TechNook!" }],
      },
    ],
  },
  {
    host: "pantryrecipes.connectedera.local",
    name: "Pantry Recipes",
    tagline: "Easy home cooking from what's already in your cupboard",
    theme: { bg: "#fff8ee", header: "#b5522c", headerText: "#fff6e8", accent: "#b5522c", font: "Georgia, 'Times New Roman', serif" },
    nav: [
      { label: "Home", path: "/" },
      { label: "Breakfast", path: "/recipes/blueberry-pancakes" },
      { label: "Baking", path: "/recipes/melon-bread" },
      { label: "Drinks", path: "/recipes/hot-cocoa" },
    ],
    pages: [
      {
        path: "/",
        title: "Pantry Recipes",
        summary: "Easy recipes from everyday ingredients: pancakes, bread, cocoa and more.",
        publishedAt: "2009-03-01T00:00:00Z",
        tags: ["recipes", "cooking", "food"],
        blocks: [
          { kind: "p", text: "Simple recipes, no fancy gadgets needed. Here's what people are cooking this week:" },
          { kind: "action", label: "Fluffy Blueberry Pancakes", action: "link", target: "/recipes/blueberry-pancakes" },
          { kind: "action", label: "Rainy Day Hot Cocoa", action: "link", target: "/recipes/hot-cocoa" },
          { kind: "action", label: "Melon Bread (Melonpan)", action: "link", target: "/recipes/melon-bread" },
          { kind: "action", label: "Fresh Summer Lemonade", action: "link", target: "/recipes/summer-lemonade" },
        ],
      },
      {
        path: "/recipes/blueberry-pancakes",
        title: "Fluffy Blueberry Pancakes",
        summary: "Thick, fluffy pancakes with blueberries in about 20 minutes. Perfect for a lazy Saturday.",
        publishedAt: "2011-05-02T12:00:00Z",
        tags: ["pancakes", "breakfast", "blueberry", "recipe"],
        blocks: [
          { kind: "h", text: "Ingredients" },
          { kind: "list", items: ["1 1/2 cups flour", "2 tbsp sugar", "2 tsp baking powder", "a pinch of salt", "1 1/4 cups milk", "1 egg", "2 tbsp melted butter", "1 cup blueberries"] },
          { kind: "h", text: "Method" },
          { kind: "list", ordered: true, items: ["Whisk the dry ingredients in a big bowl.", "Whisk the milk, egg and butter in another bowl, then pour into the dry mix. Stir until just combined (lumps are fine!).", "Heat a pan over medium heat and add a little butter.", "Pour in 1/4 cup of batter, scatter on blueberries, and flip when bubbles appear.", "Stack them high and add maple syrup. Enjoy!"] },
        ],
      },
      {
        path: "/recipes/hot-cocoa",
        title: "Rainy Day Hot Cocoa",
        summary: "Rich, creamy hot cocoa from cocoa powder, milk and a little sugar. Ready in five minutes.",
        publishedAt: "2010-12-01T12:00:00Z",
        tags: ["hot cocoa", "hot chocolate", "drink", "winter", "recipe"],
        blocks: [
          { kind: "list", items: ["2 cups milk", "2 tbsp cocoa powder", "2 tbsp sugar", "a few drops of vanilla", "marshmallows (very important)"] },
          { kind: "list", ordered: true, items: ["Mix the cocoa and sugar with a splash of milk to make a paste.", "Add the rest of the milk and warm it gently, stirring.", "Add the vanilla, pour into mugs and top with marshmallows."] },
        ],
      },
      {
        path: "/recipes/melon-bread",
        title: "Melon Bread (Melonpan)",
        summary: "Soft sweet buns with a crisp cookie top, a Japanese bakery favourite. Not actually melon-flavoured!",
        publishedAt: "2012-03-15T12:00:00Z",
        tags: ["melon bread", "melonpan", "baking", "bread", "japanese", "recipe"],
        blocks: [
          { kind: "p", text: "Melonpan gets its name from its crisscross cookie top, which looks a bit like a melon. Fresh from the oven, it's wonderful." },
          { kind: "h", text: "Dough" },
          { kind: "list", items: ["2 1/2 cups bread flour", "1/4 cup sugar", "1 tsp instant yeast", "3/4 cup warm milk", "1 egg", "3 tbsp soft butter"] },
          { kind: "h", text: "Cookie top" },
          { kind: "list", items: ["1/4 cup butter", "1/3 cup sugar", "1 egg", "1 1/4 cups flour"] },
          { kind: "list", ordered: true, items: ["Knead the dough ingredients until smooth and let it rise for an hour.", "Mix the cookie dough and chill it.", "Divide the bread dough into 8 balls. Cover each with a flattened disc of cookie dough.", "Roll the tops in sugar and score a crisscross pattern.", "Let them rise for 30 minutes, then bake at 350°F (180°C) for 15 minutes."] },
        ],
      },
      {
        path: "/recipes/summer-lemonade",
        title: "Fresh Summer Lemonade",
        summary: "Homemade lemonade with real lemons, a little sugar and lots of ice.",
        publishedAt: "2012-06-20T12:00:00Z",
        tags: ["lemonade", "summer", "drink", "recipe"],
        blocks: [
          { kind: "list", items: ["6 lemons", "1/2 cup sugar", "4 cups cold water", "ice and mint leaves"] },
          { kind: "list", ordered: true, items: ["Warm the sugar with 1 cup of water until it dissolves, then let it cool.", "Squeeze the lemons.", "Mix the lemon juice, syrup and remaining water. Serve over ice with mint."] },
        ],
      },
    ],
  },
  {
    host: "mail.connectedera.local",
    name: "ConnectMail",
    tagline: "Free email for everyone with a Connected PC",
    theme: { bg: "#eef4fb", header: "#1f5fae", headerText: "#ffffff", accent: "#1f5fae", font: "Arial, Helvetica, sans-serif" },
    nav: [
      { label: "Home", path: "/" },
      { label: "Help", path: "/help" },
    ],
    pages: [
      {
        path: "/",
        title: "ConnectMail",
        summary: "Free email with your Connected PC account. Read your mail in the Mail program.",
        publishedAt: "2009-10-22T12:00:00Z",
        tags: ["email", "mail", "connectmail", "inbox"],
        blocks: [
          { kind: "p", text: "Every account on a Connected PC comes with a free ConnectMail address. The easiest way to read and send mail is the Mail program on your computer." },
          { kind: "action", label: "Open Mail", action: "open-app", target: "mail" },
        ],
      },
      {
        path: "/help",
        title: "ConnectMail Help",
        summary: "How to write, reply, forward, attach files and organise your mail into folders.",
        publishedAt: "2009-10-22T12:00:00Z",
        tags: ["email", "help", "attachments", "folders"],
        blocks: [
          { kind: "list", items: ["Write: click New in Mail. Drafts save automatically.", "Attach: choose Attach file and pick something from your computer.", "Organise: make folders and move messages into them.", "Search: type in the search box to find any message."] },
          { kind: "action", label: "Open Mail", action: "open-app", target: "mail" },
        ],
      },
    ],
  },
];

export const staticSiteByHost = (host: string) => staticSites.find((s) => s.host === host.replace(/^www\./, ""));
