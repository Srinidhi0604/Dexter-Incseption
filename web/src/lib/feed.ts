import { type FeedPostType, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

interface CreateFeedPostInput {
  userId: string;
  type: FeedPostType;
  content: string;
  xpEarned?: number;
  metadata?: Prisma.InputJsonValue;
}

export async function createFeedPost(input: CreateFeedPostInput) {
  return prisma.feedPost.create({
    data: {
      userId: input.userId,
      type: input.type,
      content: input.content,
      xpEarned: input.xpEarned ?? 0,
      metadata: input.metadata,
    },
  });
}
