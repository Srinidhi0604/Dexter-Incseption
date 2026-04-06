import { NextResponse } from "next/server";

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

    const post = await prisma.feedPost.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existingLike = await prisma.feedLike.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: user.id,
        },
      },
    });

    let liked = false;
    if (existingLike) {
      await prisma.feedLike.delete({
        where: {
          postId_userId: {
            postId: id,
            userId: user.id,
          },
        },
      });
    } else {
      liked = true;
      await prisma.feedLike.create({
        data: {
          postId: id,
          userId: user.id,
        },
      });
    }

    const likesCount = await prisma.feedLike.count({ where: { postId: id } });

    return NextResponse.json({
      liked,
      likesCount,
    });
  } catch (error) {
    console.error("[feed/like]", error);
    return NextResponse.json({ error: "Unable to update like" }, { status: 500 });
  }
}
