import { NextResponse } from "next/server";

import { createFeedPost } from "@/lib/feed";
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

    const participant = await prisma.driveParticipant.findUnique({
      where: {
        driveId_userId: {
          driveId: id,
          userId: user.id,
        },
      },
      include: {
        drive: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Join the drive before check-in" },
        { status: 400 },
      );
    }

    if (participant.status === "CHECKED_IN") {
      return NextResponse.json({ checkedIn: true, alreadyCheckedIn: true });
    }

    await prisma.driveParticipant.update({
      where: {
        driveId_userId: {
          driveId: id,
          userId: user.id,
        },
      },
      data: {
        status: "CHECKED_IN",
        checkedInAt: new Date(),
      },
    });

    await createFeedPost({
      userId: user.id,
      type: "DRIVE_CHECKED_IN",
      content: `Checked in at ${participant.drive.title}.`,
      xpEarned: 0,
      metadata: {
        driveId: participant.drive.id,
      },
    });

    return NextResponse.json({ checkedIn: true });
  } catch (error) {
    console.error("[drives/checkin]", error);
    return NextResponse.json(
      { error: "Unable to check in" },
      { status: 500 },
    );
  }
}
