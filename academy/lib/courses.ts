// Catalog for the prototype. The RN Respirator Fit Testing Train-the-Trainer
// program mirrors the real NursesWeCare Academy flagship; the other courses
// are sample offerings built around NursesWeCare's services (fit testing,
// occupational health, CPR/BLS, wound care, health fairs and IEN support).
// Prices, schedules and faculty are placeholders until the real details are in.

export type Category =
  | "Respiratory Protection"
  | "Occupational Health"
  | "Clinical Skills"
  | "Emergency Response"
  | "IEN Pathways"
  | "Community Health";

export type Level = "Foundational" | "Intermediate" | "Advanced";

export type Format = "In person" | "Virtual" | "Blended";

export type Lesson = {
  title: string;
  minutes: number;
  kind: "video" | "reading" | "practice" | "quiz" | "live";
};

export type Module = {
  title: string;
  summary: string;
  lessons: Lesson[];
};

export type Instructor = {
  name: string;
  credentials: string;
  role: string;
  bio: string;
  initials: string;
};

export type Course = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: Category;
  level: Level;
  format: Format;
  learningHours: number;
  weeks: number;
  rating: number;
  learners: number;
  price: number | null; // CAD; null means "contact us for pricing"
  cover: CoverTheme;
  icon: CourseIcon;
  outcomes: string[];
  audience: string[];
  instructor: Instructor;
  modules: Module[];
  featured?: boolean;
  flagship?: boolean;
};

export type CoverTheme = "sky" | "pink" | "blend" | "periwinkle" | "aqua" | "rose";

export type CourseIcon =
  | "shield"
  | "wind"
  | "heart-pulse"
  | "bandage"
  | "globe"
  | "users"
  | "clipboard"
  | "home"
  | "leaf";

export const CATEGORIES: Category[] = [
  "Respiratory Protection",
  "Occupational Health",
  "Clinical Skills",
  "Emergency Response",
  "IEN Pathways",
  "Community Health",
];

export const LEVELS: Level[] = ["Foundational", "Intermediate", "Advanced"];

export const FORMATS: Format[] = ["In person", "Virtual", "Blended"];

const RN_FACULTY: Instructor = {
  name: "NursesWeCare RN Faculty",
  credentials: "Registered Nurses",
  role: "Respiratory Protection & Occupational Health",
  bio: "Our programs are developed and delivered by Registered Nurses who fit test, teach and support healthcare teams across the Hamilton area every week.",
  initials: "RN",
};

export const courses: Course[] = [
  {
    slug: "rn-respirator-fit-testing-train-the-trainer",
    title: "RN Respirator Fit Testing Train-the-Trainer",
    tagline: "Become the fit testing lead your workplace can count on.",
    description:
      "Our flagship program prepares Registered Nurses to deliver respirator fit testing and training in healthcare and workplace settings. You'll build a strong foundation in respiratory protection, practise qualitative fit testing hands-on, learn clear documentation, and develop the teaching skills to train others with confidence, so your organization can build its own internal fit testing capacity.",
    category: "Respiratory Protection",
    level: "Advanced",
    format: "Blended",
    learningHours: 14,
    weeks: 3,
    rating: 4.9,
    learners: 320,
    price: null,
    cover: "blend",
    icon: "shield",
    featured: true,
    flagship: true,
    outcomes: [
      "Explain respiratory protection principles and the CSA Z94.4-18 standard",
      "Describe aerosol science and airborne transmission in plain language",
      "Perform qualitative fit testing accurately and safely",
      "Document fit test results clearly and consistently",
      "Apply adult learning principles to train other fit testers",
      "Support your workplace in running its own fit testing program",
    ],
    audience: [
      "Registered Nurses in occupational health, IPAC or staff education",
      "Healthcare employers building internal fit testing capacity",
      "Nurse educators supporting clinical placements",
    ],
    instructor: RN_FACULTY,
    modules: [
      {
        title: "Respiratory protection foundations",
        summary: "Why respiratory protection matters and the standards that guide it.",
        lessons: [
          { title: "Welcome to the program", minutes: 10, kind: "video" },
          { title: "Respiratory protection principles", minutes: 25, kind: "video" },
          { title: "Understanding CSA Z94.4-18", minutes: 20, kind: "reading" },
        ],
      },
      {
        title: "Aerosol science and filtration",
        summary: "How particles travel and how respirators keep us protected.",
        lessons: [
          { title: "Aerosol science and airborne transmission", minutes: 25, kind: "video" },
          { title: "Respirator types and filtration", minutes: 20, kind: "video" },
          { title: "Infection prevention and control connections", minutes: 15, kind: "reading" },
          { title: "Check your understanding", minutes: 15, kind: "quiz" },
        ],
      },
      {
        title: "Qualitative fit testing in practice",
        summary: "Hands-on practice at our Hamilton training space.",
        lessons: [
          { title: "Preparing the client and the space", minutes: 15, kind: "video" },
          { title: "Step-by-step qualitative fit test", minutes: 30, kind: "video" },
          { title: "Hands-on practicum", minutes: 180, kind: "live" },
        ],
      },
      {
        title: "Documentation and records",
        summary: "Keep accurate, audit-ready fit testing records.",
        lessons: [
          { title: "Documenting a fit test", minutes: 15, kind: "video" },
          { title: "Record-keeping practice", minutes: 20, kind: "practice" },
        ],
      },
      {
        title: "Training others",
        summary: "Bring adult learning principles to your own sessions.",
        lessons: [
          { title: "Adult learning principles", minutes: 20, kind: "video" },
          { title: "Plan your first training session", minutes: 30, kind: "practice" },
          { title: "Teach-back evaluation", minutes: 90, kind: "live" },
        ],
      },
    ],
  },
  {
    slug: "respiratory-protection-essentials",
    title: "Respiratory Protection Essentials",
    tagline: "Know your respirator, wear it well and stay protected.",
    description:
      "A friendly, practical introduction to respiratory protection for anyone who wears an N95 at work or on placement. Learn how respirators work, how to put one on and take it off properly, how to do a seal check, and what to expect at your fit test.",
    category: "Respiratory Protection",
    level: "Foundational",
    format: "Virtual",
    learningHours: 2,
    weeks: 1,
    rating: 4.8,
    learners: 1640,
    price: 25,
    cover: "sky",
    icon: "wind",
    featured: true,
    outcomes: [
      "Explain how an N95 respirator protects you",
      "Put on and remove a respirator correctly",
      "Perform a user seal check every time",
      "Know how to prepare for your fit test appointment",
    ],
    audience: [
      "Nursing and healthcare students heading to clinical placements",
      "Healthcare workers and staff in any setting that uses respirators",
    ],
    instructor: RN_FACULTY,
    modules: [
      {
        title: "How respirators protect you",
        summary: "The basics of filtration and fit.",
        lessons: [
          { title: "Why fit matters", minutes: 10, kind: "video" },
          { title: "Respirators vs. masks", minutes: 8, kind: "reading" },
        ],
      },
      {
        title: "Wearing it well",
        summary: "Donning, doffing and seal checks.",
        lessons: [
          { title: "Donning and doffing step by step", minutes: 12, kind: "video" },
          { title: "The user seal check", minutes: 8, kind: "video" },
          { title: "Getting ready for your fit test", minutes: 6, kind: "reading" },
          { title: "Check your understanding", minutes: 10, kind: "quiz" },
        ],
      },
    ],
  },
  {
    slug: "ipac-foundations",
    title: "Infection Prevention & Control Foundations",
    tagline: "Everyday IPAC practices that keep patients and teams safe.",
    description:
      "Build confidence with the core infection prevention and control practices used across Ontario healthcare settings: hand hygiene, routine practices, additional precautions, PPE selection and point-of-care risk assessment.",
    category: "Occupational Health",
    level: "Foundational",
    format: "Virtual",
    learningHours: 5,
    weeks: 2,
    rating: 4.8,
    learners: 980,
    price: 59,
    cover: "aqua",
    icon: "clipboard",
    outcomes: [
      "Complete a point-of-care risk assessment",
      "Choose the right PPE for routine and additional precautions",
      "Model great hand hygiene for your team",
      "Respond calmly and clearly to exposure situations",
    ],
    audience: ["Nurses and nursing students", "Personal support workers and allied health staff"],
    instructor: RN_FACULTY,
    modules: [
      {
        title: "Routine practices",
        summary: "The everyday habits behind safe care.",
        lessons: [
          { title: "Hand hygiene that sticks", minutes: 10, kind: "video" },
          { title: "Point-of-care risk assessment", minutes: 15, kind: "video" },
        ],
      },
      {
        title: "Additional precautions and PPE",
        summary: "Contact, droplet and airborne precautions in practice.",
        lessons: [
          { title: "Choosing the right PPE", minutes: 14, kind: "video" },
          { title: "Case scenarios", minutes: 20, kind: "practice" },
          { title: "Check your understanding", minutes: 10, kind: "quiz" },
        ],
      },
    ],
  },
  {
    slug: "occupational-health-nursing-essentials",
    title: "Occupational Health Nursing Essentials",
    tagline: "Support healthy, safe workplaces from the ground up.",
    description:
      "An introduction to the growing field of occupational health nursing. Explore workplace hazard assessment, health surveillance, return-to-work support and building wellness programs that people genuinely enjoy taking part in.",
    category: "Occupational Health",
    level: "Intermediate",
    format: "Blended",
    learningHours: 10,
    weeks: 4,
    rating: 4.7,
    learners: 410,
    price: 149,
    cover: "periwinkle",
    icon: "users",
    outcomes: [
      "Describe the role of the occupational health nurse",
      "Identify and assess common workplace hazards",
      "Support employees through return-to-work planning",
      "Design a simple workplace wellness initiative",
    ],
    audience: ["Nurses exploring occupational health", "Workplace health and safety teams"],
    instructor: RN_FACULTY,
    modules: [
      {
        title: "The occupational health nurse",
        summary: "Scope, standards and the people you'll work with.",
        lessons: [
          { title: "A day in occupational health", minutes: 15, kind: "video" },
          { title: "Ontario workplace health and safety basics", minutes: 20, kind: "reading" },
        ],
      },
      {
        title: "Healthy workplaces",
        summary: "Assess hazards and grow wellness.",
        lessons: [
          { title: "Hazard assessment walkthrough", minutes: 25, kind: "practice" },
          { title: "Return-to-work support", minutes: 18, kind: "video" },
          { title: "Wellness program workshop", minutes: 90, kind: "live" },
        ],
      },
    ],
  },
  {
    slug: "bls-cpr-healthcare-providers",
    title: "CPR & BLS for Healthcare Providers",
    tagline: "Hands-on skills to respond with confidence.",
    description:
      "A hands-on Basic Life Support session for healthcare providers and students. Practise high-quality CPR, AED use and team-based resuscitation with RN instructors in a small, supportive group.",
    category: "Emergency Response",
    level: "Foundational",
    format: "In person",
    learningHours: 4,
    weeks: 1,
    rating: 4.9,
    learners: 1210,
    price: 95,
    cover: "pink",
    icon: "heart-pulse",
    featured: true,
    outcomes: [
      "Deliver high-quality CPR for adults, children and infants",
      "Use an AED safely and quickly",
      "Work as part of a coordinated resuscitation team",
    ],
    audience: ["Nurses and nursing students", "Anyone needing BLS for work or placement"],
    instructor: RN_FACULTY,
    modules: [
      {
        title: "Before class",
        summary: "A short online warm-up.",
        lessons: [{ title: "BLS refresher video", minutes: 20, kind: "video" }],
      },
      {
        title: "Hands-on session",
        summary: "Skills practice at our Hamilton training space.",
        lessons: [
          { title: "CPR and AED skills stations", minutes: 120, kind: "live" },
          { title: "Team scenarios and skills check", minutes: 60, kind: "live" },
        ],
      },
    ],
  },
  {
    slug: "advanced-wound-care-fundamentals",
    title: "Advanced Wound Care Fundamentals",
    tagline: "Assess, treat and support healing with confidence.",
    description:
      "Grow your wound care practice with evidence-informed assessment, dressing selection and documentation, plus how telenursing can support clients between visits.",
    category: "Clinical Skills",
    level: "Intermediate",
    format: "Blended",
    learningHours: 8,
    weeks: 3,
    rating: 4.8,
    learners: 560,
    price: 129,
    cover: "rose",
    icon: "bandage",
    outcomes: [
      "Complete a thorough wound assessment",
      "Choose dressings that support healing",
      "Document wound progress clearly",
      "Support clients virtually between visits",
    ],
    audience: ["Community and home care nurses", "Nurses wanting to grow their wound care skills"],
    instructor: RN_FACULTY,
    modules: [
      {
        title: "Wound assessment",
        summary: "A structured, repeatable approach.",
        lessons: [
          { title: "Wound healing basics", minutes: 15, kind: "video" },
          { title: "Assessment walkthrough", minutes: 20, kind: "video" },
        ],
      },
      {
        title: "Treatment and follow-up",
        summary: "Dressings, documentation and telenursing.",
        lessons: [
          { title: "Dressing selection guide", minutes: 15, kind: "reading" },
          { title: "Case practice", minutes: 25, kind: "practice" },
          { title: "Supporting clients by phone and video", minutes: 12, kind: "video" },
          { title: "Check your understanding", minutes: 10, kind: "quiz" },
        ],
      },
    ],
  },
  {
    slug: "ien-pathways-ontario",
    title: "IEN Pathways: Nursing in Ontario",
    tagline: "Peer support and practical guidance for internationally educated nurses.",
    description:
      "Built from our years of supporting internationally educated nurses, this program walks you through the Ontario nursing landscape, from registration steps to workplace culture, with a warm peer community cheering you on.",
    category: "IEN Pathways",
    level: "Foundational",
    format: "Virtual",
    learningHours: 6,
    weeks: 4,
    rating: 4.9,
    learners: 870,
    price: 0,
    cover: "pink",
    icon: "globe",
    outcomes: [
      "Understand the steps toward practising in Ontario",
      "Feel at home with Canadian workplace communication",
      "Build a study and career plan that fits your life",
      "Connect with nurses who've walked the same path",
    ],
    audience: ["Internationally educated nurses in or moving to Ontario"],
    instructor: RN_FACULTY,
    modules: [
      {
        title: "Your pathway",
        summary: "Registration steps and planning ahead.",
        lessons: [
          { title: "The road to practising in Ontario", minutes: 20, kind: "video" },
          { title: "Your personal pathway planner", minutes: 20, kind: "practice" },
        ],
      },
      {
        title: "Thriving at work",
        summary: "Culture, communication and community.",
        lessons: [
          { title: "Communication in Canadian care settings", minutes: 15, kind: "video" },
          { title: "Peer circle", minutes: 60, kind: "live" },
          { title: "Career growth resources", minutes: 10, kind: "reading" },
        ],
      },
    ],
  },
  {
    slug: "community-health-fairs",
    title: "Planning Community Health Fairs",
    tagline: "Bring health education and screening to your neighbourhood.",
    description:
      "Learn how NursesWeCare plans health fairs and wellness workshops, from finding partners to running welcoming screening and education stations, and leave with your own event plan.",
    category: "Community Health",
    level: "Intermediate",
    format: "Virtual",
    learningHours: 4,
    weeks: 2,
    rating: 4.7,
    learners: 290,
    price: 49,
    cover: "aqua",
    icon: "home",
    outcomes: [
      "Plan a health fair from idea to event day",
      "Partner with local organizations",
      "Run engaging education and screening stations",
    ],
    audience: ["Nurses passionate about community health", "Workplace wellness coordinators"],
    instructor: RN_FACULTY,
    modules: [
      {
        title: "Planning",
        summary: "Partners, logistics and a great plan.",
        lessons: [
          { title: "Health fair planning toolkit", minutes: 20, kind: "practice" },
          { title: "Finding community partners", minutes: 10, kind: "reading" },
        ],
      },
      {
        title: "Event day",
        summary: "Make it welcoming and fun.",
        lessons: [
          { title: "Education stations that engage", minutes: 15, kind: "video" },
          { title: "Planning workshop", minutes: 60, kind: "live" },
        ],
      },
    ],
  },
  {
    slug: "healthy-habits-healthcare-workers",
    title: "Wellness Workshop: Healthy Habits at Work",
    tagline: "Simple, energizing habits for busy healthcare teams.",
    description:
      "A relaxed, interactive workshop on staying energized through busy shifts: movement, rest, nourishment and quick reset practices, plus ideas to bring back to your whole team.",
    category: "Occupational Health",
    level: "Foundational",
    format: "Virtual",
    learningHours: 2,
    weeks: 1,
    rating: 4.8,
    learners: 740,
    price: 0,
    cover: "rose",
    icon: "leaf",
    outcomes: [
      "Use quick reset practices during a shift",
      "Plan restful days that recharge you",
      "Share wellness ideas with your team",
    ],
    audience: ["Nurses and healthcare teams", "Workplace wellness champions"],
    instructor: RN_FACULTY,
    modules: [
      {
        title: "Healthy habits",
        summary: "Energy, rest and resets.",
        lessons: [
          { title: "Live wellness workshop", minutes: 75, kind: "live" },
          { title: "Your healthy habits plan", minutes: 15, kind: "practice" },
        ],
      },
    ],
  },
];

export function getCourse(slug: string) {
  return courses.find((c) => c.slug === slug);
}

export function lessonCount(course: Course) {
  return course.modules.reduce((n, m) => n + m.lessons.length, 0);
}

export function totalMinutes(course: Course) {
  return course.modules.reduce(
    (n, m) => n + m.lessons.reduce((k, l) => k + l.minutes, 0),
    0
  );
}

export function formatPrice(price: number | null) {
  if (price === null) return "Contact us";
  if (price === 0) return "Free";
  return `CA$${price}`;
}
