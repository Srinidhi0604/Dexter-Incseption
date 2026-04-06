import { NextResponse } from "next/server";
import { z } from "zod";

import { createFeedPost } from "@/lib/feed";
import {
  completeActionAndReward,
  getLevelProgress,
  toSessionUser,
} from "@/lib/gamification";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server-auth";

const completeMissionSchema = z.object({
  actionId: z.string().min(1),
  quantity: z.number().int().min(1).max(5).optional(),
});

const postTypeMap: Record<
  string,
  "ISSUE_REPORTED" | "ISSUE_RESOLVED" | "DRIVE_JOINED"
> = {
  report_issue: "ISSUE_REPORTED",
  issue_resolved: "ISSUE_RESOLVED",
  join_drive: "DRIVE_JOINED",
};

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const parsed = completeMissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid mission completion payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await completeActionAndReward({
      userId: user.id,
      actionId: parsed.data.actionId,
      quantity: parsed.data.quantity,
    });

    await createFeedPost({
      userId: user.id,
      type: postTypeMap[result.action.slug] ?? "MISSION_COMPLETED",
      content: `Completed ${result.action.title}.`,
      xpEarned: result.totalXpGain,
    });

    return NextResponse.json({
      success: true,
      actionTitle: result.action.title,
      xpGained: result.totalXpGain,
      streakBonus: result.streakBonus,
      unlockedBadges: result.unlockedBadges,
      user: toSessionUser(result.user),
      levelProgress: getLevelProgress(result.user.xp),
    });
  } catch (error) {
    console.error("[missions/complete]", error);
    return NextResponse.json(
      { error: "Unable to complete mission" },
      { status: 500 },
    );
  }
}
