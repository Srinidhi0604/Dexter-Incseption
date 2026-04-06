import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const posts = await prisma.feedPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            ward: true,
            avatarUrl: true,
          },
        },
        likes: {
          where: {
            userId: user.id,
          },
          select: {
            id: true,
          },
        },
        comments: {
          take: 3,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({
      posts: posts.map((post: (typeof posts)[number]) => ({
        id: post.id,
        type: post.type,
        content: post.content,
        xpEarned: post.xpEarned,
        createdAt: post.createdAt,
        hasLiked: post.likes.length > 0,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        user: post.user,
        comments: [...post.comments].reverse(),
      })),
    });
  } catch (error) {
    console.error("[feed]", error);
    return NextResponse.json({ error: "Unable to load feed" }, { status: 500 });
  }
}
