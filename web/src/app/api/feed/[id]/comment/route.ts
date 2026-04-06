import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server-auth";

const commentSchema = z.object({
  content: z.string().trim().min(1).max(240),
});

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
    const body = await request.json();
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid comment payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const post = await prisma.feedPost.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comment = await prisma.feedComment.create({
      data: {
        postId: id,
        userId: user.id,
        content: parsed.data.content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const commentsCount = await prisma.feedComment.count({ where: { postId: id } });

    return NextResponse.json({
      comment,
      commentsCount,
    });
  } catch (error) {
    console.error("[feed/comment]", error);
    return NextResponse.json(
      { error: "Unable to add comment" },
      { status: 500 },
    );
  }
}
