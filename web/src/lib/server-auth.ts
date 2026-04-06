import { NextResponse } from "next/server";

import { verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token);
  if (!payload?.sub) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: payload.sub },
  });
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
