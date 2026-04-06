import { NextResponse } from "next/server";
import { z } from "zod";

import { signAuthToken, verifyPassword } from "@/lib/auth";
import { toSessionUser } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid login payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = await signAuthToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({
      token,
      user: toSessionUser(user),
    });
  } catch (error) {
    console.error("[auth/login]", error);
    return NextResponse.json(
      { error: "Unable to login at this time" },
      { status: 500 },
    );
  }
}
