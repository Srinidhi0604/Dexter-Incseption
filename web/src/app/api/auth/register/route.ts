import { NextResponse } from "next/server";
import { z } from "zod";

import { signAuthToken, hashPassword } from "@/lib/auth";
import { MAX_USERS } from "@/lib/constants";
import { createFeedPost } from "@/lib/feed";
import { calculateLevel, toSessionUser } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(64),
  ward: z.string().min(2).max(40),
});

function buildInviteCode(name: string, ward: string) {
  const cleanedName = name.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase();
  const cleanedWard = ward.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
  return `${cleanedName}${cleanedWard}${Math.floor(100 + Math.random() * 899)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid registration payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, email, password, ward } = parsed.data;

    const [existingUser, totalUsers] = await Promise.all([
      prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
      prisma.user.count(),
    ]);

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    if (totalUsers >= MAX_USERS) {
      return NextResponse.json(
        {
          error:
            "CivicPulse+ currently supports up to 50 active users in this deployment.",
        },
        { status: 403 },
      );
    }

    const passwordHash = await hashPassword(password);

    let inviteCode = buildInviteCode(name, ward);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const exists = await prisma.user.findUnique({ where: { inviteCode } });
      if (!exists) {
        break;
      }
      inviteCode = buildInviteCode(name, ward);
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        ward,
        level: calculateLevel(0),
        inviteCode,
      },
    });

    const starterBadges = await prisma.badge.findMany({
      where: { thresholdXp: { lte: user.xp } },
      select: { id: true },
    });

    if (starterBadges.length > 0) {
      await prisma.userBadge.createMany({
        data: starterBadges.map((badge: { id: string }) => ({
          userId: user.id,
          badgeId: badge.id,
        })),
        skipDuplicates: true,
      });
    }

    await createFeedPost({
      userId: user.id,
      type: "MISSION_COMPLETED",
      content: "Joined CivicPulse+ and started a new civic streak.",
      xpEarned: 0,
    });

    const token = await signAuthToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json(
      {
        token,
        user: toSessionUser(user),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[auth/register]", error);
    return NextResponse.json(
      { error: "Unable to register user at this time" },
      { status: 500 },
    );
  }
}
