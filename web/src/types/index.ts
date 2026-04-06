export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  ward: string;
  xp: number;
  level: number;
  streak: number;
  impactCo2: number;
  civicPoints: number;
  impactScore: number;
  inviteCode: string;
}

export interface MissionItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  xpValue: number;
  impactValue: number;
  icon: string;
  targetCount: number;
  countdownMins: number;
  category: "SUSTAINABILITY" | "CIVIC" | "LEARNING";
  missionTrack: "PERSONAL" | "COMMUNITY";
  completedCount: number;
}

export interface DashboardPayload {
  user: SessionUser;
  dailyCompletion: number;
  xpToday: number;
  impactMessage: string;
  weeklyImpact: {
    co2: number;
    civicPoints: number;
    actions: number;
  };
}

export interface IssuePayload {
  id: string;
  category: string;
  status: IssueStatus;
  imageUrl: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  description?: string | null;
  timeline: {
    id: string;
    status: IssueStatus;
    note: string;
    createdAt: string;
  }[];
}

export interface FeedPostPayload {
  id: string;
  type: string;
  content: string;
  xpEarned: number;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  hasLiked: boolean;
  user: {
    id: string;
    name: string;
    ward: string;
    avatarUrl?: string | null;
  };
  comments: {
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
    };
  }[];
}
