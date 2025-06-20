import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { startOfDay } from "date-fns";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

// Validation schema
const trackStatsSchema = z.object({
  focusTime: z.number().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const result = trackStatsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: result.error.errors },
        { status: 400 }
      );
    }

    const { focusTime } = result.data;

    // Get current date (UTC midnight)
    const today = startOfDay(new Date());

    // Update or create stats for today using Prisma Accelerate
    const stats = await prisma.stats.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        focusTime: {
          increment: focusTime,
        },
        updatedAt: new Date(),
      },
      create: {
        userId,
        date: today,
        focusTime,
      },
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[TRACK_STATS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to save stats" },
      { status: 500 }
    );
  }
}
