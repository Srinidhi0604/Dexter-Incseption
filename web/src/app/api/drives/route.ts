import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server-auth";

const createDriveSchema = z.object({
  title: z.string().min(4).max(80),
  description: z.string().min(6).max(240),
  locationLabel: z.string().min(2).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  ward: z.string().min(2).max(40),
  date: z.string().datetime(),
});

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const drives = await prisma.drive.findMany({
      orderBy: { date: "asc" },
      where: {
        date: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
      },
      include: {
        participants: {
          where: { userId: user.id },
          select: {
            status: true,
            checkedInAt: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
      take: 20,
    });

    return NextResponse.json({
      drives: drives.map((drive: (typeof drives)[number]) => ({
        ...drive,
        participantsCount: drive._count.participants,
        joined: drive.participants.length > 0,
        checkedIn: drive.participants[0]?.status === "CHECKED_IN",
      })),
    });
  } catch (error) {
    console.error("[drives:get]", error);
    return NextResponse.json({ error: "Unable to load drives" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const parsed = createDriveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid drive payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const drive = await prisma.drive.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        locationLabel: parsed.data.locationLabel,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        date: new Date(parsed.data.date),
        ward: parsed.data.ward,
        createdById: user.id,
      },
    });

    await prisma.driveParticipant.create({
      data: {
        driveId: drive.id,
        userId: user.id,
        status: "JOINED",
      },
    });

    return NextResponse.json({ drive }, { status: 201 });
  } catch (error) {
    console.error("[drives:post]", error);
    return NextResponse.json({ error: "Unable to create drive" }, { status: 500 });
  }
}
