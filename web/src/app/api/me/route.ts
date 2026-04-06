import { NextResponse } from "next/server";

import { toSessionUser } from "@/lib/gamification";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server-auth";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  return NextResponse.json({
    user: toSessionUser(user),
  });
}
