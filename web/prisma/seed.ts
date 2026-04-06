import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const xpToLevel = (xp: number) => Math.floor(xp / 120) + 1;

const badgeSeeds = [
  {
    key: "seed",
    title: "Seed",
    tier: "Seed",
    description: "You started your civic journey.",
    thresholdXp: 0,
    icon: "Sprout",
  },
  {
    key: "sapling",
    title: "Sapling",
    tier: "Sapling",
    description: "100+ XP and growing impact.",
    thresholdXp: 100,
    icon: "Leaf",
  },
  {
    key: "guardian",
    title: "Guardian",
    tier: "Guardian",
    description: "400+ XP and consistent contributions.",
    thresholdXp: 400,
    icon: "Shield",
  },
  {
    key: "champion",
    title: "Champion",
    tier: "Champion",
    description: "900+ XP and city-level influence.",
    thresholdXp: 900,
    icon: "Crown",
  },
];

type SeedActionInput = {
  slug: string;
  title: string;
  description: string;
  xpValue: number;
  impactValue: number;
  category: "SUSTAINABILITY" | "CIVIC" | "LEARNING";
  missionTrack: "PERSONAL" | "COMMUNITY";
  targetCount: number;
  countdownMins: number;
  icon: string;
};

const actionSeeds: SeedActionInput[] = [
  {
    slug: "walk_or_cycle",
    title: "Walk or cycle for a short trip",
    description: "Replace one short motor ride with a greener commute.",
    xpValue: 10,
    impactValue: 2.2,
    category: "SUSTAINABILITY",
    missionTrack: "PERSONAL",
    targetCount: 1,
    countdownMins: 1440,
    icon: "Bike",
  },
  {
    slug: "energy_saver",
    title: "Cut standby power",
    description: "Switch off idle appliances before leaving home.",
    xpValue: 10,
    impactValue: 1.8,
    category: "SUSTAINABILITY",
    missionTrack: "PERSONAL",
    targetCount: 1,
    countdownMins: 1440,
    icon: "Zap",
  },
  {
    slug: "water_guardian",
    title: "Save water in daily routine",
    description: "Reduce tap usage and complete two water-smart actions.",
    xpValue: 10,
    impactValue: 1.4,
    category: "SUSTAINABILITY",
    missionTrack: "PERSONAL",
    targetCount: 2,
    countdownMins: 1440,
    icon: "Droplets",
  },
  {
    slug: "neighborhood_cleanup",
    title: "Complete 4 neighborhood actions",
    description: "Collect, sort, and dispose of litter points in your area.",
    xpValue: 10,
    impactValue: 5,
    category: "CIVIC",
    missionTrack: "COMMUNITY",
    targetCount: 4,
    countdownMins: 1440,
    icon: "Trash2",
  },
  {
    slug: "report_issue",
    title: "Report a civic issue",
    description: "Capture and report a local issue through CivicPulse+.",
    xpValue: 20,
    impactValue: 10,
    category: "CIVIC",
    missionTrack: "COMMUNITY",
    targetCount: 1,
    countdownMins: 1440,
    icon: "AlertTriangle",
  },
  {
    slug: "issue_resolved",
    title: "Close a reported issue",
    description: "Issue moved to resolved status with before/after proof.",
    xpValue: 50,
    impactValue: 25,
    category: "CIVIC",
    missionTrack: "COMMUNITY",
    targetCount: 1,
    countdownMins: 10080,
    icon: "CheckCircle2",
  },
  {
    slug: "join_drive",
    title: "Join a local cleaning drive",
    description: "RSVP and contribute on-ground to a ward drive.",
    xpValue: 30,
    impactValue: 15,
    category: "CIVIC",
    missionTrack: "COMMUNITY",
    targetCount: 1,
    countdownMins: 4320,
    icon: "Users",
  },
  {
    slug: "learning_quiz",
    title: "Finish a learning quiz",
    description: "Complete micro-learning and answer one quiz correctly.",
    xpValue: 15,
    impactValue: 0,
    category: "LEARNING",
    missionTrack: "PERSONAL",
    targetCount: 1,
    countdownMins: 1440,
    icon: "BookOpen",
  },
];

type SeedUserInput = {
  name: string;
  email: string;
  ward: string;
  xp: number;
  streak: number;
  impactCo2: number;
  civicPoints: number;
};

function buildInviteCode(name: string, ward: string) {
  const cleanedName = name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase();
  const cleanedWard = ward.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
  return `${cleanedName}${cleanedWard}${Math.floor(100 + Math.random() * 899)}`;
}

async function upsertUser(user: SeedUserInput, passwordHash: string) {
  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      ward: user.ward,
      xp: user.xp,
      level: xpToLevel(user.xp),
      streak: user.streak,
      impactCo2: user.impactCo2,
      civicPoints: user.civicPoints,
      passwordHash,
    },
    create: {
      name: user.name,
      email: user.email,
      ward: user.ward,
      xp: user.xp,
      level: xpToLevel(user.xp),
      streak: user.streak,
      impactCo2: user.impactCo2,
      civicPoints: user.civicPoints,
      passwordHash,
      inviteCode: buildInviteCode(user.name, user.ward),
    },
  });
}

async function main() {
  for (const badge of badgeSeeds) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: badge,
      create: badge,
    });
  }

  for (const action of actionSeeds) {
    await prisma.action.upsert({
      where: { slug: action.slug },
      update: action,
      create: action,
    });
  }

  const passwordHash = await hash("Demo@123", 10);

  const users: SeedUserInput[] = [
    {
      name: "Alex Mercer",
      email: "demo@civicpulse.app",
      ward: "Ward-7",
      xp: 460,
      streak: 5,
      impactCo2: 38.6,
      civicPoints: 140,
    },
    {
      name: "Rhea Nair",
      email: "rhea@civicpulse.app",
      ward: "Ward-7",
      xp: 320,
      streak: 4,
      impactCo2: 22.3,
      civicPoints: 98,
    },
    {
      name: "Aman Verma",
      email: "aman@civicpulse.app",
      ward: "Ward-7",
      xp: 270,
      streak: 3,
      impactCo2: 18.1,
      civicPoints: 73,
    },
    {
      name: "Zoya Khan",
      email: "zoya@civicpulse.app",
      ward: "Ward-5",
      xp: 520,
      streak: 8,
      impactCo2: 44.2,
      civicPoints: 188,
    },
    {
      name: "Mira Patel",
      email: "mira@civicpulse.app",
      ward: "Ward-5",
      xp: 210,
      streak: 2,
      impactCo2: 15.8,
      civicPoints: 48,
    },
    {
      name: "Noah Singh",
      email: "noah@civicpulse.app",
      ward: "Ward-3",
      xp: 180,
      streak: 2,
      impactCo2: 13.1,
      civicPoints: 35,
    },
  ];

  const seededUsers = [];
  for (const user of users) {
    const seeded = await upsertUser(user, passwordHash);
    seededUsers.push(seeded);
  }

  const demoUser = seededUsers[0];

  const firstDrive = await prisma.drive.upsert({
    where: { id: "drive_city_lake_cleanup" },
    update: {
      title: "City Lake Cleanup Sprint",
      description: "Community drive focused on lake-edge trash removal.",
      locationLabel: "City Lake, Gate 2",
      latitude: 12.9721,
      longitude: 77.595,
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      ward: "Ward-7",
      createdById: demoUser.id,
    },
    create: {
      id: "drive_city_lake_cleanup",
      title: "City Lake Cleanup Sprint",
      description: "Community drive focused on lake-edge trash removal.",
      locationLabel: "City Lake, Gate 2",
      latitude: 12.9721,
      longitude: 77.595,
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      ward: "Ward-7",
      createdById: demoUser.id,
    },
  });

  await prisma.drive.upsert({
    where: { id: "drive_market_street_restore" },
    update: {
      title: "Market Street Restore",
      description: "Morning cleanup and paint touch-up near bus stop.",
      locationLabel: "Market Street Bus Stop",
      latitude: 12.9801,
      longitude: 77.6022,
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
      ward: "Ward-7",
      createdById: demoUser.id,
    },
    create: {
      id: "drive_market_street_restore",
      title: "Market Street Restore",
      description: "Morning cleanup and paint touch-up near bus stop.",
      locationLabel: "Market Street Bus Stop",
      latitude: 12.9801,
      longitude: 77.6022,
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
      ward: "Ward-7",
      createdById: demoUser.id,
    },
  });

  await prisma.driveParticipant.createMany({
    data: seededUsers.slice(0, 4).map((user) => ({
      driveId: firstDrive.id,
      userId: user.id,
      status: "JOINED",
    })),
    skipDuplicates: true,
  });

  const reportAction = await prisma.action.findUnique({ where: { slug: "report_issue" } });
  const walkAction = await prisma.action.findUnique({ where: { slug: "walk_or_cycle" } });

  if (reportAction && walkAction) {
    const hasActions =
      (await prisma.userAction.count({ where: { userId: demoUser.id } })) > 0;

    if (!hasActions) {
      await prisma.userAction.createMany({
        data: [
          {
            userId: demoUser.id,
            actionId: walkAction.id,
            completedCount: 1,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26),
          },
          {
            userId: demoUser.id,
            actionId: reportAction.id,
            completedCount: 1,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          },
        ],
      });
    }
  }

  const hasIssue = (await prisma.issue.count({ where: { userId: demoUser.id } })) > 0;
  if (!hasIssue) {
    const issue = await prisma.issue.create({
      data: {
        userId: demoUser.id,
        imageUrl:
          "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=1200&q=80",
        description: "Overflowing waste near public park entrance.",
        category: "garbage",
        status: "IN_PROGRESS",
        latitude: 12.9732,
        longitude: 77.601,
        locationLabel: "Ward-7, Park Entrance",
      },
    });

    await prisma.issueTimeline.createMany({
      data: [
        {
          issueId: issue.id,
          status: "OPEN",
          note: "Issue submitted by resident.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        },
        {
          issueId: issue.id,
          status: "IN_PROGRESS",
          note: "Assigned to ward sanitation team.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        },
      ],
    });
  }

  const feedCount = await prisma.feedPost.count();
  if (feedCount < 6) {
    await prisma.feedPost.createMany({
      data: [
        {
          userId: demoUser.id,
          type: "MISSION_COMPLETED",
          content: "Completed Walk or cycle for a short trip.",
          xpEarned: 10,
        },
        {
          userId: seededUsers[1].id,
          type: "DRIVE_JOINED",
          content: "Joined City Lake Cleanup Sprint.",
          xpEarned: 30,
        },
        {
          userId: seededUsers[3].id,
          type: "ISSUE_RESOLVED",
          content: "Resolved a pothole issue near Main Square.",
          xpEarned: 50,
        },
      ],
    });
  }

  const allBadges = await prisma.badge.findMany();
  for (const user of seededUsers) {
    const eligibleBadgeIds = allBadges
      .filter((badge: { thresholdXp: number }) => user.xp >= badge.thresholdXp)
      .map((badge: { id: string }) => badge.id);

    if (eligibleBadgeIds.length > 0) {
      await prisma.userBadge.createMany({
        data: eligibleBadgeIds.map((badgeId: string) => ({
          userId: user.id,
          badgeId,
        })),
        skipDuplicates: true,
      });
    }
  }

  console.log("CivicPulse+ seed complete. Demo login: demo@civicpulse.app / Demo@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
