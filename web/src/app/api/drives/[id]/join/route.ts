import { NextResponse } from "next/server";

import { createFeedPost } from "@/lib/feed";
import { completeActionAndReward, toSessionUser } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server-auth";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    const drive = await prisma.drive.findUnique({ where: { id } });
    if (!drive) {
      return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    }

    const existingParticipant = await prisma.driveParticipant.findUnique({
      where: {
        driveId_userId: {
          driveId: id,
          userId: user.id,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json({
        joined: true,
        alreadyJoined: true,
      });
    }

    await prisma.driveParticipant.create({
      data: {
        driveId: id,
        userId: user.id,
        status: "JOINED",
      },
    });

    const joinDriveAction = await prisma.action.findUnique({
      where: { slug: "join_drive" },
      select: { id: true },
    });

    let reward = null;
    if (joinDriveAction) {
      const result = await completeActionAndReward({
        userId: user.id,
        actionId: joinDriveAction.id,
      });

      reward = {
        xpGained: result.totalXpGain,
        streakBonus: result.streakBonus,
        unlockedBadges: result.unlockedBadges,
        user: toSessionUser(result.user),
      };

      await createFeedPost({
        userId: user.id,
        type: "DRIVE_JOINED",
        content: `Joined drive ${drive.title}.`,
        xpEarned: result.totalXpGain,
        metadata: {
          driveId: drive.id,
        },
      });
    }

    return NextResponse.json({ joined: true, reward });
  } catch (error) {
    console.error("[drives/join]", error);
    return NextResponse.json({ error: "Unable to join drive" }, { status: 500 });
  }
}
