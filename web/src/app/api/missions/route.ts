import { NextResponse } from "next/server";

import { getTodayProgressByAction } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const [actions, todayProgressMap] = await Promise.all([
      prisma.action.findMany({
        where: {
          category: {
            in: ["SUSTAINABILITY", "CIVIC"],
          },
        },
        orderBy: [
          {
            missionTrack: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      }),
      getTodayProgressByAction(user.id),
    ]);

    const missions = actions.map((action: (typeof actions)[number]) => ({
      ...action,
      completedCount: todayProgressMap.get(action.id) ?? 0,
    }));

    return NextResponse.json({
      personal: missions.filter(
        (mission: (typeof missions)[number]) => mission.missionTrack === "PERSONAL",
      ),
      community: missions.filter(
        (mission: (typeof missions)[number]) => mission.missionTrack === "COMMUNITY",
      ),
    });
  } catch (error) {
    console.error("[missions]", error);
    return NextResponse.json({ error: "Unable to load missions" }, { status: 500 });
  }
}
