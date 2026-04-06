import { NextResponse } from "next/server";

import { toSessionUser } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        badges: {
          include: {
            badge: true,
          },
          orderBy: {
            earnedAt: "desc",
          },
        },
        driveParticipations: {
          include: {
            drive: {
              select: {
                id: true,
                title: true,
                locationLabel: true,
                ward: true,
                date: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 6,
        },
        issues: {
          select: {
            id: true,
            category: true,
            status: true,
            locationLabel: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        _count: {
          select: {
            issues: true,
            actions: true,
            driveParticipations: true,
          },
        },
      },
    });

    if (!profile) {
      return unauthorizedResponse();
    }

    const communitiesJoined = [
      profile.ward,
      ...profile.driveParticipations.map(
        (entry: (typeof profile.driveParticipations)[number]) => entry.drive.ward,
      ),
    ];

    return NextResponse.json({
      user: toSessionUser(profile),
      stats: {
        missionsCompleted: profile._count.actions,
        issuesReported: profile._count.issues,
        drivesJoined: profile._count.driveParticipations,
      },
      badges: profile.badges.map((entry: (typeof profile.badges)[number]) => ({
        id: entry.badge.id,
        key: entry.badge.key,
        title: entry.badge.title,
        tier: entry.badge.tier,
        description: entry.badge.description,
        icon: entry.badge.icon,
        earnedAt: entry.earnedAt,
      })),
      communitiesJoined: [...new Set(communitiesJoined)],
      recentDrives: profile.driveParticipations,
      recentIssues: profile.issues,
    });
  } catch (error) {
    console.error("[profile]", error);
    return NextResponse.json({ error: "Unable to load profile" }, { status: 500 });
  }
}
