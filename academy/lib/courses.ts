// Sample catalog for the prototype. Everything here is placeholder content
// written to show the shape of a real catalog; swap it for real courses later.

export type Category =
  | "Clinical Skills"
  | "Nurse Wellbeing"
  | "Leadership"
  | "Career Growth"
  | "Community Health";

export type Level = "Beginner" | "Intermediate" | "Advanced";

export type Format = "Self-paced" | "Live cohort" | "Workshop";

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
  ceHours: number;
  weeks: number;
  rating: number;
  learners: number;
  price: number; // 0 means included free with membership
  cover: CoverTheme;
  icon: CourseIcon;
  outcomes: string[];
  audience: string[];
  instructor: Instructor;
  modules: Module[];
  featured?: boolean;
};

export type CoverTheme = "teal" | "coral" | "sage" | "sky" | "plum" | "sun";

export type CourseIcon =
  | "heart-pulse"
  | "leaf"
  | "compass"
  | "users"
  | "stethoscope"
  | "sparkles"
  | "graduation"
  | "home"
  | "message";

export const CATEGORIES: Category[] = [
  "Clinical Skills",
  "Nurse Wellbeing",
  "Leadership",
  "Career Growth",
  "Community Health",
];

export const LEVELS: Level[] = ["Beginner", "Intermediate", "Advanced"];

export const FORMATS: Format[] = ["Self-paced", "Live cohort", "Workshop"];

export const courses: Course[] = [
  {
    slug: "resilient-care-everyday-wellbeing",
    title: "Resilient Care: Everyday Wellbeing for Nurses",
    tagline: "Small, practical habits that keep you steady and bright on shift.",
    description:
      "A warm, practical course on building daily routines that support your energy, focus and joy at work. You'll learn quick reset techniques you can use between patients, ways to protect your rest, and how to bring a little more ease into every shift.",
    category: "Nurse Wellbeing",
    level: "Beginner",
    format: "Self-paced",
    ceHours: 6,
    weeks: 3,
    rating: 4.9,
    learners: 2140,
    price: 0,
    cover: "sage",
    icon: "leaf",
    featured: true,
    outcomes: [
      "Use three-minute reset practices during a busy shift",
      "Build a pre-shift and post-shift routine that fits your life",
      "Plan restful days off that genuinely recharge you",
      "Create a personal wellbeing plan you can keep coming back to",
    ],
    audience: [
      "Nurses at any stage of their career",
      "Students preparing for clinical placements",
      "Nurse managers looking for ideas to share with their teams",
    ],
    instructor: {
      name: "Dana Whitfield",
      credentials: "MSN, RN",
      role: "Wellbeing Program Lead",
      bio: "Dana spent twelve years on a busy medical-surgical floor before focusing on nurse wellbeing. She loves turning research into simple habits people actually enjoy.",
      initials: "DW",
    },
    modules: [
      {
        title: "Your energy, your way",
        summary: "Understand what fuels you and what drains you on a typical shift.",
        lessons: [
          { title: "Welcome and how this course works", minutes: 5, kind: "video" },
          { title: "Mapping your energy across a shift", minutes: 12, kind: "practice" },
          { title: "The science of small breaks", minutes: 10, kind: "reading" },
        ],
      },
      {
        title: "Reset in three minutes",
        summary: "Quick breathing, movement and grounding practices for the hallway or break room.",
        lessons: [
          { title: "Box breathing, step by step", minutes: 8, kind: "video" },
          { title: "Stretches you can do in scrubs", minutes: 9, kind: "video" },
          { title: "Try it on your next shift", minutes: 15, kind: "practice" },
        ],
      },
      {
        title: "Rest that restores",
        summary: "Sleep tips for every schedule, including nights and rotating shifts.",
        lessons: [
          { title: "Sleep strategies for shift workers", minutes: 14, kind: "video" },
          { title: "Designing a recharge day", minutes: 10, kind: "practice" },
          { title: "Your personal wellbeing plan", minutes: 20, kind: "practice" },
          { title: "Check your understanding", minutes: 10, kind: "quiz" },
        ],
      },
    ],
  },
  {
    slug: "confident-clinical-assessment",
    title: "Confident Clinical Assessment",
    tagline: "Sharpen your head-to-toe assessment and trust what you notice.",
    description:
      "Build a structured, confident approach to patient assessment. Through short videos, case walk-throughs and practice checklists, you'll strengthen the skills that help you spot changes early and communicate them clearly.",
    category: "Clinical Skills",
    level: "Intermediate",
    format: "Self-paced",
    ceHours: 10,
    weeks: 4,
    rating: 4.8,
    learners: 3285,
    price: 89,
    cover: "teal",
    icon: "stethoscope",
    featured: true,
    outcomes: [
      "Perform a focused, systematic head-to-toe assessment",
      "Recognize early signs of a changing patient condition",
      "Document findings clearly and consistently",
      "Use SBAR to share concerns with the care team",
    ],
    audience: [
      "Newer nurses building clinical confidence",
      "Experienced nurses moving to a new specialty",
    ],
    instructor: {
      name: "Marcus Okafor",
      credentials: "DNP, APRN, CCRN",
      role: "Clinical Educator",
      bio: "Marcus has precepted dozens of new graduates and is known for making complex physiology feel friendly and memorable.",
      initials: "MO",
    },
    modules: [
      {
        title: "A system that works every time",
        summary: "Set up a repeatable assessment flow you can rely on.",
        lessons: [
          { title: "Why structure builds confidence", minutes: 7, kind: "video" },
          { title: "The head-to-toe flow", minutes: 18, kind: "video" },
          { title: "Printable assessment checklist", minutes: 5, kind: "reading" },
        ],
      },
      {
        title: "Noticing the early signs",
        summary: "Spot subtle trends in vitals, mental status and skin.",
        lessons: [
          { title: "Trends tell the story", minutes: 15, kind: "video" },
          { title: "Case walk-through: the quiet change", minutes: 20, kind: "practice" },
          { title: "Check your understanding", minutes: 10, kind: "quiz" },
        ],
      },
      {
        title: "Speaking up with clarity",
        summary: "Communicate findings so the whole team can act quickly.",
        lessons: [
          { title: "SBAR in real life", minutes: 12, kind: "video" },
          { title: "Practice script builder", minutes: 15, kind: "practice" },
          { title: "Documentation that helps the next shift", minutes: 10, kind: "reading" },
        ],
      },
    ],
  },
  {
    slug: "charge-nurse-essentials",
    title: "Charge Nurse Essentials",
    tagline: "Lead the shift with calm, clarity and a team-first mindset.",
    description:
      "Step into the charge role with confidence. This live cohort covers assignments, flow, delegation and team communication, with plenty of time to learn from fellow nurses who are stepping up too.",
    category: "Leadership",
    level: "Intermediate",
    format: "Live cohort",
    ceHours: 12,
    weeks: 6,
    rating: 4.9,
    learners: 860,
    price: 149,
    cover: "plum",
    icon: "users",
    featured: true,
    outcomes: [
      "Make balanced, thoughtful patient assignments",
      "Delegate with clarity and appreciation",
      "Run a quick, useful huddle",
      "Support teammates through a busy shift",
    ],
    audience: [
      "Nurses preparing for their first charge shifts",
      "New charge nurses who want a supportive peer group",
    ],
    instructor: {
      name: "Priya Raman",
      credentials: "MSN, RN, NE-BC",
      role: "Nurse Leadership Coach",
      bio: "Priya has led units across three hospitals and now coaches new leaders. Her sessions are known for being practical, encouraging and full of real stories.",
      initials: "PR",
    },
    modules: [
      {
        title: "The charge mindset",
        summary: "What great charge nurses do differently.",
        lessons: [
          { title: "Live kickoff and introductions", minutes: 60, kind: "live" },
          { title: "Leading from where you stand", minutes: 12, kind: "video" },
        ],
      },
      {
        title: "Assignments and flow",
        summary: "Balance acuity, skills and continuity of care.",
        lessons: [
          { title: "Assignment-building workshop", minutes: 60, kind: "live" },
          { title: "Practice: build tonight's board", minutes: 20, kind: "practice" },
        ],
      },
      {
        title: "Team communication",
        summary: "Huddles, delegation and recognizing great work.",
        lessons: [
          { title: "The five-minute huddle", minutes: 10, kind: "video" },
          { title: "Delegation role-play", minutes: 60, kind: "live" },
          { title: "Celebrating your team", minutes: 8, kind: "reading" },
          { title: "Final reflection", minutes: 15, kind: "quiz" },
        ],
      },
    ],
  },
  {
    slug: "new-grad-thriving-first-year",
    title: "Thriving in Your First Year",
    tagline: "A friendly roadmap from orientation to feeling at home on the unit.",
    description:
      "Everything we wish someone had told us in year one. Learn how to organize your shift, ask great questions, build relationships with your team and celebrate how much you're growing.",
    category: "Career Growth",
    level: "Beginner",
    format: "Self-paced",
    ceHours: 5,
    weeks: 3,
    rating: 4.8,
    learners: 4012,
    price: 0,
    cover: "sun",
    icon: "graduation",
    outcomes: [
      "Organize your shift with a simple brain sheet",
      "Ask for help in ways that build trust",
      "Set goals with your preceptor",
      "Track and celebrate your progress",
    ],
    audience: ["New graduate nurses", "Nursing students in their final year"],
    instructor: {
      name: "Alex Moreno",
      credentials: "BSN, RN",
      role: "Residency Program Coordinator",
      bio: "Alex coordinates a nurse residency program and loves helping new nurses find their footing and their people.",
      initials: "AM",
    },
    modules: [
      {
        title: "Getting organized",
        summary: "Tools that make a twelve-hour shift feel manageable.",
        lessons: [
          { title: "Your brain sheet, your way", minutes: 10, kind: "video" },
          { title: "Prioritizing with confidence", minutes: 12, kind: "video" },
        ],
      },
      {
        title: "Growing with your team",
        summary: "Build strong relationships with preceptors and peers.",
        lessons: [
          { title: "Great questions to ask", minutes: 8, kind: "reading" },
          { title: "Goal-setting with your preceptor", minutes: 15, kind: "practice" },
          { title: "Celebrate your wins", minutes: 6, kind: "practice" },
        ],
      },
    ],
  },
  {
    slug: "compassionate-communication",
    title: "Compassionate Communication",
    tagline: "Connect with patients and families in every conversation.",
    description:
      "Explore communication techniques that help patients feel heard and help families feel included. Practice active listening, teach-back and culturally responsive care in short, interactive lessons.",
    category: "Clinical Skills",
    level: "Beginner",
    format: "Workshop",
    ceHours: 3,
    weeks: 1,
    rating: 4.7,
    learners: 1530,
    price: 39,
    cover: "coral",
    icon: "message",
    outcomes: [
      "Use active listening to build trust quickly",
      "Confirm understanding with teach-back",
      "Adapt your approach to each patient's culture and preferences",
    ],
    audience: ["All nurses and nursing students", "Patient care technicians"],
    instructor: {
      name: "Grace Liu",
      credentials: "MSN, RN, CNL",
      role: "Patient Experience Specialist",
      bio: "Grace helps care teams create moments that patients remember for all the right reasons.",
      initials: "GL",
    },
    modules: [
      {
        title: "Listening that lands",
        summary: "Make every patient feel heard.",
        lessons: [
          { title: "The power of the first minute", minutes: 8, kind: "video" },
          { title: "Active listening practice", minutes: 15, kind: "practice" },
        ],
      },
      {
        title: "Teaching that sticks",
        summary: "Help patients go home confident.",
        lessons: [
          { title: "Teach-back made simple", minutes: 10, kind: "video" },
          { title: "Live practice workshop", minutes: 90, kind: "live" },
        ],
      },
    ],
  },
  {
    slug: "community-health-outreach",
    title: "Community Health Outreach",
    tagline: "Bring care, education and connection beyond the hospital walls.",
    description:
      "Learn how nurses plan and lead community health events, from wellness screenings to health education sessions. You'll leave with a ready-to-use outreach plan for your own neighborhood.",
    category: "Community Health",
    level: "Intermediate",
    format: "Self-paced",
    ceHours: 8,
    weeks: 4,
    rating: 4.8,
    learners: 720,
    price: 69,
    cover: "sky",
    icon: "home",
    outcomes: [
      "Assess what your community would love support with",
      "Partner with local organizations",
      "Plan a welcoming health education event",
      "Share results and keep the momentum going",
    ],
    audience: ["Nurses interested in public and community health", "Faith community and school nurses"],
    instructor: {
      name: "Tomas Reyes",
      credentials: "MPH, BSN, RN",
      role: "Community Health Nurse",
      bio: "Tomas has organized health fairs, school programs and pop-up clinics, and he's happiest when a whole neighborhood shows up.",
      initials: "TR",
    },
    modules: [
      {
        title: "Know your community",
        summary: "Listen first, then plan.",
        lessons: [
          { title: "Community strengths mapping", minutes: 14, kind: "video" },
          { title: "Finding local partners", minutes: 10, kind: "reading" },
        ],
      },
      {
        title: "Plan your event",
        summary: "From idea to an inviting, well-run day.",
        lessons: [
          { title: "Event planning toolkit", minutes: 18, kind: "practice" },
          { title: "Health education that's fun", minutes: 12, kind: "video" },
          { title: "Check your understanding", minutes: 10, kind: "quiz" },
        ],
      },
    ],
  },
  {
    slug: "mindful-leadership",
    title: "Mindful Leadership for Nurse Managers",
    tagline: "Build a unit culture where people love to come to work.",
    description:
      "An advanced program for nurse leaders who want to create supportive, high-performing teams. Explore coaching conversations, recognition, shared governance and leading change with kindness.",
    category: "Leadership",
    level: "Advanced",
    format: "Live cohort",
    ceHours: 15,
    weeks: 8,
    rating: 4.9,
    learners: 410,
    price: 249,
    cover: "teal",
    icon: "compass",
    outcomes: [
      "Hold coaching conversations that inspire growth",
      "Build recognition into everyday routines",
      "Lead change with clarity and warmth",
      "Grow future leaders on your team",
    ],
    audience: ["Nurse managers and directors", "Assistant nurse managers"],
    instructor: {
      name: "Priya Raman",
      credentials: "MSN, RN, NE-BC",
      role: "Nurse Leadership Coach",
      bio: "Priya has led units across three hospitals and now coaches new leaders. Her sessions are known for being practical, encouraging and full of real stories.",
      initials: "PR",
    },
    modules: [
      {
        title: "Leading yourself first",
        summary: "Your values, your style, your energy.",
        lessons: [
          { title: "Cohort welcome", minutes: 60, kind: "live" },
          { title: "Your leadership values", minutes: 15, kind: "practice" },
        ],
      },
      {
        title: "Coaching and recognition",
        summary: "Help every team member grow.",
        lessons: [
          { title: "The coaching conversation", minutes: 14, kind: "video" },
          { title: "Coaching lab", minutes: 60, kind: "live" },
          { title: "Recognition rituals", minutes: 10, kind: "reading" },
        ],
      },
      {
        title: "Leading change",
        summary: "Bring your team along with you.",
        lessons: [
          { title: "Change with heart", minutes: 12, kind: "video" },
          { title: "Capstone presentations", minutes: 90, kind: "live" },
        ],
      },
    ],
  },
  {
    slug: "pediatric-care-foundations",
    title: "Pediatric Care Foundations",
    tagline: "Family-centered care for little patients and their grown-ups.",
    description:
      "A friendly introduction to pediatric nursing: developmental stages, child-friendly assessment, safe medication practice and partnering with families so kids feel safe and supported.",
    category: "Clinical Skills",
    level: "Beginner",
    format: "Self-paced",
    ceHours: 7,
    weeks: 3,
    rating: 4.7,
    learners: 1180,
    price: 79,
    cover: "sun",
    icon: "heart-pulse",
    outcomes: [
      "Adapt your assessment to each developmental stage",
      "Calculate weight-based doses safely",
      "Use play and distraction to ease procedures",
      "Partner with families as part of the care team",
    ],
    audience: ["Nurses new to pediatrics", "Nursing students"],
    instructor: {
      name: "Hannah Brooks",
      credentials: "MSN, RN, CPN",
      role: "Pediatric Nurse Educator",
      bio: "Hannah has spent her career in children's hospitals and keeps a pocket full of stickers at all times.",
      initials: "HB",
    },
    modules: [
      {
        title: "Growing and developing",
        summary: "What to expect from infancy to the teen years.",
        lessons: [
          { title: "Developmental stages at a glance", minutes: 12, kind: "video" },
          { title: "Child-friendly assessment", minutes: 14, kind: "video" },
        ],
      },
      {
        title: "Safe, gentle care",
        summary: "Medications, comfort and families.",
        lessons: [
          { title: "Weight-based dosing practice", minutes: 20, kind: "practice" },
          { title: "Comfort through play", minutes: 10, kind: "video" },
          { title: "Check your understanding", minutes: 10, kind: "quiz" },
        ],
      },
    ],
  },
  {
    slug: "career-pathways-specialty",
    title: "Career Pathways: Finding Your Specialty",
    tagline: "Explore where your nursing journey could take you next.",
    description:
      "Discover the wide world of nursing specialties, certifications and advanced roles. Hear from nurses in a range of fields and build a personal growth plan for the next few years.",
    category: "Career Growth",
    level: "Beginner",
    format: "Workshop",
    ceHours: 2,
    weeks: 1,
    rating: 4.8,
    learners: 1960,
    price: 0,
    cover: "coral",
    icon: "sparkles",
    outcomes: [
      "Compare specialties that match your interests",
      "Understand certification and education options",
      "Create a personal three-year growth plan",
    ],
    audience: ["Nurses curious about what's next", "Students exploring options"],
    instructor: {
      name: "Alex Moreno",
      credentials: "BSN, RN",
      role: "Residency Program Coordinator",
      bio: "Alex coordinates a nurse residency program and loves helping new nurses find their footing and their people.",
      initials: "AM",
    },
    modules: [
      {
        title: "Explore the possibilities",
        summary: "A tour of specialties and roles.",
        lessons: [
          { title: "Panel: a day in our specialties", minutes: 45, kind: "live" },
          { title: "Specialty explorer worksheet", minutes: 15, kind: "practice" },
        ],
      },
      {
        title: "Plan your path",
        summary: "Turn curiosity into next steps.",
        lessons: [
          { title: "Certifications explained", minutes: 10, kind: "reading" },
          { title: "Your three-year plan", minutes: 20, kind: "practice" },
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

export function formatPrice(price: number) {
  return price === 0 ? "Included with membership" : `$${price}`;
}
