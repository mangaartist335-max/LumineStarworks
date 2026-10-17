// Everything NursesWeCare Academy offers, each with its own page in the
// prototype. Highlights come from what NursesWeCare shares publicly; anything
// we don't know yet (dates, prices, sign-up steps) is marked "coming soon"
// rather than made up.

import type { CourseIcon, CoverTheme } from "./courses";

export type OfferingStatus = "available" | "booking" | "coming-soon";

export type Offering = {
  slug: string;
  title: string;
  kind: string;
  tagline: string;
  summary: string;
  icon: CourseIcon;
  cover: CoverTheme;
  status: OfferingStatus;
  /** What we can already say about it. */
  highlights: string[];
  /** What this page will grow to include. */
  comingSoon: string[];
  /** Courses in the catalog that belong to this offering. */
  courseSlugs: string[];
  action?: { label: string; href: string; external?: boolean };
};

const SITE = "https://www.nurseswecare.org";

export const STATUS_LABEL: Record<OfferingStatus, string> = {
  available: "Open for enrolment",
  booking: "Booking open",
  "coming-soon": "Coming soon",
};

export const offerings: Offering[] = [
  {
    slug: "fit-testing-train-the-trainer",
    title: "RN Respirator Fit Testing Train-the-Trainer",
    kind: "Flagship program",
    tagline: "Become the fit testing lead your workplace can count on.",
    summary:
      "Our flagship program prepares Registered Nurses to run respirator fit testing in their own workplace and to train colleagues to do it well.",
    icon: "shield",
    cover: "blend",
    status: "available",
    highlights: [
      "Respiratory protection principles and aerosol science",
      "Qualitative fit testing, practised hands-on with RN faculty",
      "Clear documentation and record keeping",
      "Infection prevention and control (IPAC) connections",
      "Adult learning skills, so you can teach others with confidence",
      "Follows the CSA Z94.4-18 standard",
    ],
    comingSoon: ["Upcoming practicum dates", "Group pricing for workplaces"],
    courseSlugs: ["rn-respirator-fit-testing-train-the-trainer", "respiratory-protection-essentials"],
    action: { label: "See the program", href: "/courses/rn-respirator-fit-testing-train-the-trainer" },
  },
  {
    slug: "n95-fit-testing",
    title: "N95 Fit Testing",
    kind: "Service",
    tagline: "Find the respirator that fits you, with a nurse by your side.",
    summary:
      "Students and workplaces can book an N95 fit test with the NursesWeCare RN team, at our Hamilton office or at your workplace.",
    icon: "wind",
    cover: "sky",
    status: "booking",
    highlights: [
      "Students: in-office fit tests in Hamilton, about 30 minutes (CA$40)",
      "Workplaces: book fit testing for your team",
      "Led by Registered Nurses",
    ],
    comingSoon: ["What to bring and how to prepare", "Online booking for students"],
    courseSlugs: ["respiratory-protection-essentials"],
    action: { label: "Book a fit test", href: `${SITE}/booking-workingplace-request-form`, external: true },
  },
  {
    slug: "cpr-bls-training",
    title: "CPR & BLS Training",
    kind: "Training",
    tagline: "Hands-on skills to respond with confidence.",
    summary:
      "Basic Life Support for healthcare providers and students, taught in small, supportive groups by RN instructors.",
    icon: "heart-pulse",
    cover: "pink",
    status: "available",
    highlights: [
      "High-quality CPR and AED practice",
      "Team-based resuscitation skills",
      "Small groups with plenty of hands-on time",
    ],
    comingSoon: ["Class dates and locations", "Renewal reminders"],
    courseSlugs: ["bls-cpr-healthcare-providers"],
    action: { label: "See the course", href: "/courses/bls-cpr-healthcare-providers" },
  },
  {
    slug: "advanced-wound-care",
    title: "Advanced Wound Care",
    kind: "Clinical care & training",
    tagline: "Assess, treat and support healing with confidence.",
    summary:
      "Learn advanced wound care with RN faculty, and find out about telenursing support for people caring for wounds at home.",
    icon: "bandage",
    cover: "periwinkle",
    status: "available",
    highlights: [
      "Wound assessment and treatment skills",
      "Telenursing support for wound care",
      "Taught by experienced Registered Nurses",
    ],
    comingSoon: ["How telenursing visits work", "Upcoming course dates"],
    courseSlugs: ["advanced-wound-care-fundamentals"],
    action: { label: "See the course", href: "/courses/advanced-wound-care-fundamentals" },
  },
  {
    slug: "wellness-and-health-fairs",
    title: "Wellness Workshops & Health Fairs",
    kind: "Workshops & events",
    tagline: "Bring health, safety and wellness to your team and community.",
    summary:
      "Energizing wellness workshops for workplaces, and community health fairs that bring education and screening to your neighbourhood.",
    icon: "leaf",
    cover: "aqua",
    status: "available",
    highlights: [
      "Wellness workshops for healthcare and workplace teams",
      "Community health fairs with health education",
      "Planned and led by Registered Nurses",
    ],
    comingSoon: ["Workshop topics you can book", "Upcoming health fair dates"],
    courseSlugs: ["healthy-habits-healthcare-workers", "community-health-fairs"],
    action: { label: "Browse workshops", href: "/courses?category=Community%20Health" },
  },
  {
    slug: "peer-support-community",
    title: "Peer Support Community",
    kind: "Community",
    tagline: "A warm place for nurses to connect, ask and cheer each other on.",
    summary:
      "A peer-support community for nurses and internationally educated nurses (IENs), to share questions, wins and encouragement.",
    icon: "users",
    cover: "rose",
    status: "coming-soon",
    highlights: [
      "Peer support for nurses at every stage",
      "A welcoming space for internationally educated nurses",
    ],
    comingSoon: ["How to join", "Community guidelines", "Meet-up dates"],
    courseSlugs: ["ien-pathways-ontario"],
  },
];

export function getOffering(slug: string) {
  return offerings.find((o) => o.slug === slug);
}
