import { startOfDay } from "date-fns";
import { NextResponse } from "next/server";

import { LEARNING_MODULES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const [learningAction, todayProgress] = await Promise.all([
      prisma.action.findUnique({
        where: { slug: "learning_quiz" },
        select: { xpValue: true },
      }),
      prisma.learningProgress.findMany({
        where: {
          userId: user.id,
          completedAt: { gte: startOfDay(new Date()) },
        },
        select: {
          moduleKey: true,
        },
      }),
    ]);

    const completedSet = new Set(
      todayProgress.map((entry: (typeof todayProgress)[number]) => entry.moduleKey),
    );

    return NextResponse.json({
      modules: LEARNING_MODULES.map((module) => ({
        ...module,
        xpReward: learningAction?.xpValue ?? 15,
        completedToday: completedSet.has(module.id),
      })),
    });
  } catch (error) {
    console.error("[learning]", error);
    return NextResponse.json(
      { error: "Unable to load learning content" },
      { status: 500 },
    );
  }
}
