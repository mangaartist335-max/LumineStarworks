// A sample learner used to fill the dashboard in this prototype.

export type Enrollment = {
  slug: string;
  progress: number; // 0-100
  nextLesson: string;
  lastActive: string;
};

export type LiveSession = {
  title: string;
  courseSlug: string;
  date: string;
  time: string;
  host: string;
};

export type Certificate = {
  courseTitle: string;
  earned: string;
  hours: number;
};

export const learner = {
  firstName: "Jordan",
  fullName: "Jordan Ellis",
  initials: "JE",
  role: "RN, Occupational Health · Hamilton, ON",
  memberSince: "March 2026",
  hoursGoal: 30,
  hoursEarned: 8,
  streakDays: 12,
  minutesThisWeek: 94,
  weeklyGoalMinutes: 120,
};

export const enrollments: Enrollment[] = [
  {
    slug: "rn-respirator-fit-testing-train-the-trainer",
    progress: 62,
    nextLesson: "Hands-on practicum",
    lastActive: "Yesterday",
  },
  {
    slug: "ipac-foundations",
    progress: 35,
    nextLesson: "Choosing the right PPE",
    lastActive: "3 days ago",
  },
  {
    slug: "advanced-wound-care-fundamentals",
    progress: 12,
    nextLesson: "Assessment walkthrough",
    lastActive: "Last week",
  },
];

export const liveSessions: LiveSession[] = [
  {
    title: "Fit testing hands-on practicum",
    courseSlug: "rn-respirator-fit-testing-train-the-trainer",
    date: "Thu, Oct 16",
    time: "9:00 AM ET",
    host: "RN Faculty · 702 Upper James St., Hamilton",
  },
  {
    title: "Community health fair planning workshop",
    courseSlug: "community-health-fairs",
    date: "Tue, Oct 21",
    time: "12:30 PM ET",
    host: "RN Faculty · Online",
  },
];

export const certificates: Certificate[] = [
  {
    courseTitle: "Respiratory Protection Essentials",
    earned: "Sep 2026",
    hours: 2,
  },
  {
    courseTitle: "CPR & BLS for Healthcare Providers",
    earned: "Jul 2026",
    hours: 4,
  },
  {
    courseTitle: "Wellness Workshop: Healthy Habits at Work",
    earned: "May 2026",
    hours: 2,
  },
];

export const recommendedSlugs = [
  "occupational-health-nursing-essentials",
  "ien-pathways-ontario",
  "community-health-fairs",
];
