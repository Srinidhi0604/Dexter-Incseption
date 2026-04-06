import { NextResponse } from "next/server";

import { computeImpactScore } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") === "friends" ? "friends" : "ward";

    let whereClause:
      | {
          ward?: string;
          id?: { in: string[] };
        }
      | undefined;

    if (scope === "ward") {
      whereClause = { ward: user.ward };
    } else {
      const joinedDriveIds = await prisma.driveParticipant.findMany({
        where: { userId: user.id },
        select: { driveId: true },
      });

      const friendParticipants = await prisma.driveParticipant.findMany({
        where: {
          driveId: {
            in: joinedDriveIds.map(
              (item: (typeof joinedDriveIds)[number]) => item.driveId,
            ),
          },
        },
        select: { userId: true },
      });

      const friendIds = [
        ...new Set(
          friendParticipants.map(
            (entry: (typeof friendParticipants)[number]) => entry.userId,
          ),
        ),
      ].filter((entry): entry is string => typeof entry === "string");
      whereClause =
        friendIds.length > 0 ? { id: { in: friendIds } } : { ward: user.ward };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: [{ xp: "desc" }, { streak: "desc" }],
      take: 20,
      select: {
        id: true,
        name: true,
        ward: true,
        xp: true,
        level: true,
        streak: true,
        impactCo2: true,
        civicPoints: true,
      },
    });

    return NextResponse.json({
      scope,
      leaderboard: users.map((entry: (typeof users)[number], index: number) => ({
        rank: index + 1,
        id: entry.id,
        name: entry.name,
        ward: entry.ward,
        xp: entry.xp,
        level: entry.level,
        streak: entry.streak,
        impactScore: computeImpactScore(entry.impactCo2, entry.civicPoints),
      })),
    });
  } catch (error) {
    console.error("[leaderboard]", error);
    return NextResponse.json(
      { error: "Unable to load leaderboard" },
      { status: 500 },
    );
  }
}
