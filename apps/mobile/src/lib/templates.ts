import type { ProjectType } from "@/shared/types";

export interface Category {
  type: ProjectType;
  label: string;
  emoji: string;
}

/** What people can make, in friendly words (maps onto the shared project types). */
export const CATEGORIES: Category[] = [
  { type: "Mobile App", label: "Mobile app", emoji: "📱" },
  { type: "Web App", label: "Web app", emoji: "🌐" },
  { type: "Game", label: "Video game", emoji: "🎮" },
  { type: "SaaS", label: "SaaS platform", emoji: "☁️" },
  { type: "AI App", label: "AI app", emoji: "🤖" },
  { type: "Desktop App", label: "Desktop app", emoji: "🖥️" },
  { type: "Productivity App", label: "Productivity", emoji: "✅" },
  { type: "Business App", label: "Business app", emoji: "💼" },
  { type: "Developer Tool", label: "Developer tool", emoji: "🛠️" },
  { type: "Website", label: "Website", emoji: "🧭" },
  { type: "Other", label: "Something else", emoji: "✨" },
];

export function categoryFor(type: ProjectType): Category {
  return CATEGORIES.find((c) => c.type === type) ?? CATEGORIES[CATEGORIES.length - 1];
}

export interface Template {
  id: string;
  title: string;
  emoji: string;
  type: ProjectType;
  tagline: string;
  idea: string;
  targetUser: string;
  colors: [string, string];
}

export const TEMPLATES: Template[] = [
  {
    id: "saas-starter",
    title: "SaaS Starter",
    emoji: "☁️",
    type: "SaaS",
    tagline: "Accounts, a dashboard and a paid plan",
    idea: "A subscription web app where teams sign up, invite teammates, and manage their work from a clean dashboard. Includes onboarding, a settings area, usage limits on the free plan, and an upgrade page for a paid plan.",
    targetUser: "Small teams who want a simple tool without a long setup",
    colors: ["#5B7CFA", "#9163F5"],
  },
  {
    id: "mobile-app",
    title: "Mobile App",
    emoji: "📱",
    type: "Mobile App",
    tagline: "A friendly everyday phone app",
    idea: "A phone app that helps people build a small daily habit. They pick a habit, get a gentle reminder, tap to check it off, and see a streak calendar that celebrates their progress.",
    targetUser: "Busy people who want small, steady wins",
    colors: ["#34D399", "#10B981"],
  },
  {
    id: "ai-chatbot",
    title: "AI Chatbot",
    emoji: "🤖",
    type: "AI App",
    tagline: "A helpful assistant with a personality",
    idea: "A chat assistant with a friendly personality that answers questions about a specific topic, remembers the conversation, suggests follow-up questions, and lets people save useful answers.",
    targetUser: "People who want quick, friendly answers without searching",
    colors: ["#9163F5", "#F472B6"],
  },
  {
    id: "ecommerce",
    title: "E-commerce Store",
    emoji: "🛍️",
    type: "Web App",
    tagline: "Products, a cart and checkout",
    idea: "An online shop for a small brand with a product catalogue, filters, product pages with photos, a shopping cart, a simple checkout flow, and an order confirmation page.",
    targetUser: "Shoppers browsing on their phone during a quick break",
    colors: ["#F59E0B", "#F97316"],
  },
  {
    id: "social",
    title: "Social Media Platform",
    emoji: "💬",
    type: "Mobile App",
    tagline: "Posts, likes, follows and a feed",
    idea: "A small social app around a shared hobby where people post photos with captions, like and comment, follow each other, and scroll a feed of posts from people they follow.",
    targetUser: "Hobby communities who want a cosy, focused space",
    colors: ["#EC4899", "#8B5CF6"],
  },
  {
    id: "productivity",
    title: "Productivity App",
    emoji: "✅",
    type: "Productivity App",
    tagline: "Tasks, focus and planning",
    idea: "A planner that combines a to-do list, a focus timer and a weekly view. Tasks can be dragged into days, the timer tracks focused time, and a weekly summary shows what got done.",
    targetUser: "Students and freelancers juggling lots of small tasks",
    colors: ["#0EA5E9", "#6366F1"],
  },
  {
    id: "fitness",
    title: "Fitness App",
    emoji: "💪",
    type: "Mobile App",
    tagline: "Workouts, progress and streaks",
    idea: "A workout tracker where people pick a routine, follow each exercise with a timer, log sets and reps, and see progress charts and streaks over time.",
    targetUser: "Beginners building a regular workout routine at home",
    colors: ["#22C55E", "#14B8A6"],
  },
  {
    id: "finance",
    title: "Finance Tracker",
    emoji: "💰",
    type: "Mobile App",
    tagline: "Budgets and spending at a glance",
    idea: "A personal budget app where people set monthly budgets by category, log expenses quickly, and see a simple chart of where their money goes, with a gentle warning before a budget runs out.",
    targetUser: "Young adults managing their own money for the first time",
    colors: ["#10B981", "#84CC16"],
  },
  {
    id: "2d-game",
    title: "2D Game",
    emoji: "🕹️",
    type: "Game",
    tagline: "A fun arcade game with scores",
    idea: "A colourful 2D arcade game where the player dodges obstacles and collects coins, the speed slowly increases, and there's a title screen, score, lives, a game-over screen and a high score.",
    targetUser: "Casual players who want a quick, satisfying game",
    colors: ["#F43F5E", "#F59E0B"],
  },
  {
    id: "3d-game",
    title: "3D Game",
    emoji: "🧊",
    type: "Game",
    tagline: "A small 3D world to explore",
    idea: "A small 3D game where the player rolls a ball through floating platforms, collects stars, avoids falling off the edge, and reaches the goal before the timer runs out. Includes a few levels and a best-time record.",
    targetUser: "Players who enjoy short, skill-based challenges",
    colors: ["#6366F1", "#06B6D4"],
  },
  {
    id: "mmorpg",
    title: "MMORPG",
    emoji: "🐉",
    type: "Game",
    tagline: "Heroes, quests and a shared world",
    idea: "A fantasy online role-playing game where players create a hero, explore a world map, take on quests, fight monsters in simple turn-based battles, collect loot, and level up. The first version focuses on one starting town and a handful of quests.",
    targetUser: "Fans of classic fantasy RPGs who like progression and loot",
    colors: ["#7C3AED", "#DB2777"],
  },
  {
    id: "education",
    title: "Educational App",
    emoji: "🎓",
    type: "Mobile App",
    tagline: "Bite-sized lessons and quizzes",
    idea: "A learning app with short lessons on a topic, a quick quiz after each lesson, points and badges for progress, and a review mode that brings back questions people got wrong.",
    targetUser: "Learners who have 5–10 minutes a day",
    colors: ["#F59E0B", "#EAB308"],
  },
  {
    id: "portfolio",
    title: "Portfolio Website",
    emoji: "🎨",
    type: "Website",
    tagline: "Show off your work beautifully",
    idea: "A personal portfolio website with a bold intro, a gallery of projects with detail pages, an about section, and a contact form. It should look great on phones and load fast.",
    targetUser: "Creators who want to impress clients and employers",
    colors: ["#111827", "#6B7280"],
  },
  {
    id: "dev-tool",
    title: "Developer Tool",
    emoji: "🛠️",
    type: "Developer Tool",
    tagline: "A handy tool for coders",
    idea: "A tool that formats, validates and compares JSON. People paste JSON, see errors highlighted, pretty-print or minify it, and compare two versions side by side.",
    targetUser: "Developers who work with APIs every day",
    colors: ["#0F766E", "#2563EB"],
  },
];
