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
  ceHours: number;
};

export const learner = {
  firstName: "Jordan",
  fullName: "Jordan Ellis",
  initials: "JE",
  role: "RN, Medical-Surgical",
  memberSince: "March 2026",
  ceGoal: 24,
  ceEarned: 14,
  streakDays: 12,
  minutesThisWeek: 94,
  weeklyGoalMinutes: 120,
};

export const enrollments: Enrollment[] = [
  {
    slug: "confident-clinical-assessment",
    progress: 62,
    nextLesson: "Case walk-through: the quiet change",
    lastActive: "Yesterday",
  },
  {
    slug: "charge-nurse-essentials",
    progress: 35,
    nextLesson: "Assignment-building workshop",
    lastActive: "3 days ago",
  },
  {
    slug: "community-health-outreach",
    progress: 12,
    nextLesson: "Finding local partners",
    lastActive: "Last week",
  },
];

export const liveSessions: LiveSession[] = [
  {
    title: "Assignment-building workshop",
    courseSlug: "charge-nurse-essentials",
    date: "Thu, Oct 16",
    time: "7:00 PM ET",
    host: "Priya Raman",
  },
  {
    title: "Community coffee chat: outreach ideas",
    courseSlug: "community-health-outreach",
    date: "Tue, Oct 21",
    time: "12:30 PM ET",
    host: "Tomas Reyes",
  },
];

export const certificates: Certificate[] = [
  {
    courseTitle: "Resilient Care: Everyday Wellbeing for Nurses",
    earned: "Sep 2026",
    ceHours: 6,
  },
  {
    courseTitle: "Thriving in Your First Year",
    earned: "Jul 2026",
    ceHours: 5,
  },
  {
    courseTitle: "Compassionate Communication",
    earned: "May 2026",
    ceHours: 3,
  },
];

export const recommendedSlugs = [
  "mindful-leadership",
  "pediatric-care-foundations",
  "career-pathways-specialty",
];
