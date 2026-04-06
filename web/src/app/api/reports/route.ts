import { NextResponse } from "next/server";
import { z } from "zod";

import { classifyIssue } from "@/lib/gemini";
import { createFeedPost } from "@/lib/feed";
import {
  completeActionAndReward,
  toSessionUser,
} from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server-auth";

const reportIssueSchema = z.object({
  imageUrl: z.string().url().or(z.string().startsWith("data:image/")),
  description: z.string().max(280).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationLabel: z.string().min(2).max(140),
});

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const issues = await prisma.issue.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        timeline: {
          orderBy: { createdAt: "asc" },
        },
      },
      take: 20,
    });

    return NextResponse.json({ issues });
  } catch (error) {
    console.error("[reports:get]", error);
    return NextResponse.json({ error: "Unable to load issues" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const parsed = reportIssueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid issue payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const classification = await classifyIssue({
      imageUrl: parsed.data.imageUrl,
      description: parsed.data.description,
    });

    const issue = await prisma.issue.create({
      data: {
        userId: user.id,
        imageUrl: parsed.data.imageUrl,
        description: parsed.data.description,
        category: classification.category,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        locationLabel: parsed.data.locationLabel,
        timeline: {
          create: {
            status: "OPEN",
            note: "Issue submitted and queued for verification.",
          },
        },
      },
      include: {
        timeline: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const reportAction = await prisma.action.findUnique({
      where: { slug: "report_issue" },
      select: { id: true },
    });

    if (!reportAction) {
      return NextResponse.json(
        { error: "Report action is not configured. Seed the database first." },
        { status: 500 },
      );
    }

    const rewardResult = await completeActionAndReward({
      userId: user.id,
      actionId: reportAction.id,
    });

    await createFeedPost({
      userId: user.id,
      type: "ISSUE_REPORTED",
      content: `Reported ${classification.category.replace("_", " ")} near ${parsed.data.locationLabel}.`,
      xpEarned: rewardResult.totalXpGain,
      metadata: {
        issueId: issue.id,
        category: classification.category,
      },
    });

    return NextResponse.json(
      {
        issue,
        ai: classification,
        reward: {
          xpGained: rewardResult.totalXpGain,
          streakBonus: rewardResult.streakBonus,
          unlockedBadges: rewardResult.unlockedBadges,
        },
        user: toSessionUser(rewardResult.user),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[reports:post]", error);
    return NextResponse.json(
      { error: "Unable to submit report" },
      { status: 500 },
    );
  }
}
