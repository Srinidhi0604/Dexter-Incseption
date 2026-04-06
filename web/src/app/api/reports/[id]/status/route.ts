import { NextResponse } from "next/server";
import { z } from "zod";

import { createFeedPost } from "@/lib/feed";
import { completeActionAndReward, toSessionUser } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server-auth";

const updateStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
  note: z.string().min(2).max(140).optional(),
});

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        timeline: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!issue || issue.userId !== user.id) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: {
        status: parsed.data.status,
        timeline: {
          create: {
            status: parsed.data.status,
            note:
              parsed.data.note ??
              (parsed.data.status === "RESOLVED"
                ? "Marked resolved after field verification."
                : `Status moved to ${parsed.data.status.replace("_", " ")}.`),
          },
        },
      },
      include: {
        timeline: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    let reward: null | {
      xpGained: number;
      unlockedBadges: string[];
      user: ReturnType<typeof toSessionUser>;
    } = null;

    if (issue.status !== "RESOLVED" && parsed.data.status === "RESOLVED") {
      const resolveAction = await prisma.action.findUnique({
        where: { slug: "issue_resolved" },
        select: { id: true },
      });

      if (resolveAction) {
        const result = await completeActionAndReward({
          userId: user.id,
          actionId: resolveAction.id,
        });

        reward = {
          xpGained: result.totalXpGain,
          unlockedBadges: result.unlockedBadges,
          user: toSessionUser(result.user),
        };

        await createFeedPost({
          userId: user.id,
          type: "ISSUE_RESOLVED",
          content: `Resolved ${updatedIssue.category.replace("_", " ")} at ${updatedIssue.locationLabel}.`,
          xpEarned: result.totalXpGain,
          metadata: {
            issueId: updatedIssue.id,
          },
        });
      }
    }

    return NextResponse.json({ issue: updatedIssue, reward });
  } catch (error) {
    console.error("[reports/status]", error);
    return NextResponse.json(
      { error: "Unable to update issue status" },
      { status: 500 },
    );
  }
}
