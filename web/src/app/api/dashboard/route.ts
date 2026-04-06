import { startOfDay, subDays } from "date-fns";
import { NextResponse } from "next/server";

import { IMPACT_MESSAGE } from "@/lib/constants";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { toSessionUser } from "@/lib/gamification";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const todayStart = startOfDay(new Date());
    const weekStart = subDays(todayStart, 6);

    const [todayActions, weeklyActions] = await Promise.all([
      prisma.userAction.findMany({
        where: {
          userId: user.id,
          timestamp: { gte: todayStart },
        },
        include: {
          action: {
            select: {
              xpValue: true,
              impactValue: true,
              category: true,
            },
          },
        },
      }),
      prisma.userAction.findMany({
        where: {
          userId: user.id,
          timestamp: { gte: weekStart },
        },
        include: {
          action: {
            select: {
              impactValue: true,
              category: true,
            },
          },
        },
      }),
    ]);

    type TodayActionRow = (typeof todayActions)[number];
    type WeeklyActionRow = (typeof weeklyActions)[number];

    const actionsCompletedToday = todayActions.reduce(
      (sum: number, item: TodayActionRow) => sum + item.completedCount,
      0,
    );

    const dailyCompletion = Math.min(100, (actionsCompletedToday / 4) * 100);

    const xpTodayBase = todayActions.reduce(
      (sum: number, item: TodayActionRow) => sum + item.action.xpValue * item.completedCount,
      0,
    );

    const xpToday = xpTodayBase + (todayActions.length > 0 ? 10 : 0);

    const weeklyImpact = weeklyActions.reduce(
      (
        accumulator: { co2: number; civicPoints: number; actions: number },
        item: WeeklyActionRow,
      ) => {
        if (item.action.category === "SUSTAINABILITY") {
          accumulator.co2 += item.action.impactValue * item.completedCount;
        }

        if (item.action.category === "CIVIC") {
          accumulator.civicPoints += Math.round(
            item.action.impactValue * item.completedCount,
          );
        }

        accumulator.actions += item.completedCount;
        return accumulator;
      },
      {
        co2: 0,
        civicPoints: 0,
        actions: 0,
      },
    );

    return NextResponse.json({
      user: toSessionUser(user),
      dailyCompletion,
      xpToday,
      impactMessage: IMPACT_MESSAGE,
      weeklyImpact,
      quickActions: [
        {
          id: "qa-mission",
          title: "Complete mission",
          subtitle: "Keep your streak alive",
          href: "/missions",
        },
        {
          id: "qa-report",
          title: "Report issue",
          subtitle: "Flag problems near you",
          href: "/report",
        },
        {
          id: "qa-drive",
          title: "Join drive",
          subtitle: "Collaborate with your ward",
          href: "/community",
        },
      ],
    });
  } catch (error) {
    console.error("[dashboard]", error);
    return NextResponse.json(
      { error: "Unable to load dashboard" },
      { status: 500 },
    );
  }
}
