import { type Prisma } from "@prisma/client";
import { differenceInCalendarDays, startOfDay } from "date-fns";

import { XP_RULES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

const XP_PER_LEVEL = 120;

export function calculateLevel(totalXp: number) {
  return Math.max(1, Math.floor(totalXp / XP_PER_LEVEL) + 1);
}

export function getLevelProgress(totalXp: number) {
  const nextLevelXp = calculateLevel(totalXp) * XP_PER_LEVEL;
  const currentLevelXp = nextLevelXp - XP_PER_LEVEL;
  return {
    currentLevelXp,
    nextLevelXp,
    progress:
      ((totalXp - currentLevelXp) / Math.max(1, nextLevelXp - currentLevelXp)) * 100,
  };
}

export function computeImpactScore(co2: number, civicPoints: number) {
  return Math.round(co2 * 4 + civicPoints * 2);
}

export function toSessionUser(user: Pick<
  {
    id: string;
    name: string;
    email: string;
    ward: string;
    xp: number;
    level: number;
    streak: number;
    impactCo2: number;
    civicPoints: number;
    inviteCode: string;
  },
  | "id"
  | "name"
  | "email"
  | "ward"
  | "xp"
  | "level"
  | "streak"
  | "impactCo2"
  | "civicPoints"
  | "inviteCode"
>) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    ward: user.ward,
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    impactCo2: user.impactCo2,
    civicPoints: user.civicPoints,
    inviteCode: user.inviteCode,
    impactScore: computeImpactScore(user.impactCo2, user.civicPoints),
  } satisfies SessionUser;
}

function computeStreak(currentStreak: number, lastActionAt: Date | null, now: Date) {
  if (!lastActionAt) {
    return 1;
  }

  const diffDays = differenceInCalendarDays(startOfDay(now), startOfDay(lastActionAt));
  if (diffDays <= 0) {
    return currentStreak;
  }
  if (diffDays === 1) {
    return currentStreak + 1;
  }

  return 1;
}

async function unlockBadges(
  tx: Prisma.TransactionClient,
  userId: string,
  xp: number,
): Promise<string[]> {
  const eligibleBadges = await tx.badge.findMany({
    where: { thresholdXp: { lte: xp } },
    select: { id: true, title: true },
  });

  if (eligibleBadges.length === 0) {
    return [];
  }

  const existing = await tx.userBadge.findMany({
    where: {
      userId,
      badgeId: { in: eligibleBadges.map((badge: { id: string }) => badge.id) },
    },
    select: { badgeId: true },
  });

  const existingSet = new Set(existing.map((entry: { badgeId: string }) => entry.badgeId));
  const missing = eligibleBadges.filter((badge: { id: string }) => !existingSet.has(badge.id));

  if (missing.length > 0) {
    await tx.userBadge.createMany({
      data: missing.map((badge: { id: string }) => ({
        userId,
        badgeId: badge.id,
      })),
      skipDuplicates: true,
    });
  }

  return missing.map((badge: { title: string }) => badge.title);
}

export async function completeActionAndReward(input: {
  userId: string;
  actionId: string;
  quantity?: number;
}) {
  const quantity = Math.max(1, input.quantity ?? 1);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const action = await tx.action.findUnique({
      where: { id: input.actionId },
    });

    if (!action) {
      throw new Error("Action not found");
    }

    const user = await tx.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      throw new Error("User not found");
    }

    const now = new Date();
    const todayStart = startOfDay(now);

    const hasActionToday = await tx.userAction.findFirst({
      where: {
        userId: user.id,
        timestamp: { gte: todayStart },
      },
      select: { id: true },
    });

    const lastAction = hasActionToday
      ? null
      : await tx.userAction.findFirst({
          where: { userId: user.id },
          orderBy: { timestamp: "desc" },
          select: { timestamp: true },
        });

    const streakBonus = hasActionToday ? 0 : XP_RULES.DAILY_STREAK;
    const nextStreak = hasActionToday
      ? user.streak
      : computeStreak(user.streak, lastAction?.timestamp ?? null, now);

    const baseXp = action.xpValue * quantity;
    const totalXpGain = baseXp + streakBonus;

    const co2Gain =
      action.category === "SUSTAINABILITY"
        ? action.impactValue * quantity
        : 0;

    const civicGain =
      action.category === "CIVIC"
        ? Math.round(action.impactValue * quantity)
        : 0;

    await tx.userAction.create({
      data: {
        userId: user.id,
        actionId: action.id,
        completedCount: quantity,
        timestamp: now,
      },
    });

    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        xp: { increment: totalXpGain },
        level: calculateLevel(user.xp + totalXpGain),
        streak: nextStreak,
        impactCo2: { increment: co2Gain },
        civicPoints: { increment: civicGain },
      },
    });

    const unlockedBadges = await unlockBadges(tx, updatedUser.id, updatedUser.xp);

    return {
      action,
      user: updatedUser,
      totalXpGain,
      streakBonus,
      co2Gain,
      civicGain,
      unlockedBadges,
    };
  });
}

export async function getTodayProgressByAction(userId: string) {
  const start = startOfDay(new Date());

  const grouped = await prisma.userAction.groupBy({
    by: ["actionId"],
    where: {
      userId,
      timestamp: { gte: start },
    },
    _sum: {
      completedCount: true,
    },
  });

  return new Map(
    grouped.map(
      (row: { actionId: string; _sum: { completedCount: number | null } }) => [
        row.actionId,
        row._sum.completedCount ?? 0,
      ],
    ),
  );
}
