export const MAX_USERS = 50;

export const XP_RULES = {
  COMPLETE_MISSION: 10,
  REPORT_ISSUE: 20,
  ISSUE_RESOLVED: 50,
  JOIN_DRIVE: 30,
  DAILY_STREAK: 10,
  LEARNING_QUIZ: 15,
} as const;

export const BADGE_TIERS = [
  {
    key: "seed",
    title: "Seed",
    tier: "Seed",
    thresholdXp: 0,
    color: "from-lime-500/30 to-lime-300/10",
  },
  {
    key: "sapling",
    title: "Sapling",
    tier: "Sapling",
    thresholdXp: 100,
    color: "from-emerald-500/35 to-teal-300/10",
  },
  {
    key: "guardian",
    title: "Guardian",
    tier: "Guardian",
    thresholdXp: 400,
    color: "from-blue-500/40 to-cyan-300/10",
  },
  {
    key: "champion",
    title: "Champion",
    tier: "Champion",
    thresholdXp: 900,
    color: "from-orange-500/40 to-amber-300/10",
  },
] as const;

export const IMPACT_MESSAGE = "You helped improve your city today";

export const ISSUE_CATEGORIES = [
  "garbage",
  "pothole",
  "streetlight",
  "water_leak",
  "graffiti",
  "drain_blockage",
] as const;

export const ISSUE_STATUS_FLOW = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

export const MISSION_TABS = ["Personal", "Community"] as const;

export const LEARNING_MODULES = [
  {
    id: "waste-segregation",
    title: "Waste Segregation in 60s",
    content:
      "Separate dry and wet waste at source to reduce landfill overflow and improve collection efficiency.",
    quiz: {
      question: "Which bin should food scraps go into?",
      options: ["Dry", "Wet", "Recyclable"],
      answer: "Wet",
    },
  },
  {
    id: "citizen-reporting",
    title: "Report Better, Resolve Faster",
    content:
      "Add clear photos, precise location, and one-line context to speed up civic issue routing.",
    quiz: {
      question: "What improves issue resolution speed most?",
      options: ["Adding location", "Posting only text", "Skipping category"],
      answer: "Adding location",
    },
  },
  {
    id: "water-saving",
    title: "Daily Water Wins",
    content:
      "Fixing leaks and reducing tap runtime can save hundreds of liters each month per household.",
    quiz: {
      question: "What is the first step if you notice a leak?",
      options: ["Ignore", "Report or repair quickly", "Use more water"],
      answer: "Report or repair quickly",
    },
  },
] as const;
