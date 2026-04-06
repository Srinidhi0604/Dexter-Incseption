import { startOfDay } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";

import { LEARNING_MODULES } from "@/lib/constants";
import { createFeedPost } from "@/lib/feed";
import { completeActionAndReward, toSessionUser } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server-auth";

const completeLearningSchema = z.object({
  moduleId: z.string().min(1),
  answer: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const parsed = completeLearningSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid quiz payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const learningModule = LEARNING_MODULES.find((item) => item.id === parsed.data.moduleId);
    if (!learningModule) {
      return NextResponse.json({ error: "Learning module not found" }, { status: 404 });
    }

    if (learningModule.quiz.answer.toLowerCase() !== parsed.data.answer.toLowerCase()) {
      return NextResponse.json(
        {
          error: "Incorrect answer. Try again.",
          correctAnswer: learningModule.quiz.answer,
        },
        { status: 400 },
      );
    }

    const alreadyCompletedToday = await prisma.learningProgress.findFirst({
      where: {
        userId: user.id,
        moduleKey: learningModule.id,
        completedAt: {
          gte: startOfDay(new Date()),
        },
      },
      select: { id: true },
    });

    if (alreadyCompletedToday) {
      return NextResponse.json({
        success: true,
        alreadyCompletedToday: true,
      });
    }

    const learningAction = await prisma.action.findUnique({
      where: { slug: "learning_quiz" },
      select: { id: true },
    });

    if (!learningAction) {
      return NextResponse.json(
        { error: "Learning action not configured. Seed the database first." },
        { status: 500 },
      );
    }

    await prisma.learningProgress.create({
      data: {
        userId: user.id,
        actionId: learningAction.id,
        moduleKey: learningModule.id,
        score: 1,
      },
    });

    const rewardResult = await completeActionAndReward({
      userId: user.id,
      actionId: learningAction.id,
    });

    await createFeedPost({
      userId: user.id,
      type: "LEARNING_COMPLETED",
      content: `Completed learning card: ${learningModule.title}.`,
      xpEarned: rewardResult.totalXpGain,
      metadata: {
        moduleKey: learningModule.id,
      },
    });

    return NextResponse.json({
      success: true,
      moduleId: learningModule.id,
      xpGained: rewardResult.totalXpGain,
      streakBonus: rewardResult.streakBonus,
      unlockedBadges: rewardResult.unlockedBadges,
      user: toSessionUser(rewardResult.user),
    });
  } catch (error) {
    console.error("[learning/complete]", error);
    return NextResponse.json(
      { error: "Unable to complete quiz" },
      { status: 500 },
    );
  }
}
