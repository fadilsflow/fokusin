import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfDay, subDays } from "date-fns";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user stats and profile in parallel
    const [stats, profile] = await Promise.all([
      prisma.stats.findMany({
        where: { userId },
        select: {
          focusTime: true,
          date: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
      }),
      prisma.profile.findUnique({
        where: { userId },
        select: {
          fullName: true,
          avatarUrl: true,
        },
      }),
    ]);

    // Get all stats for calculations
    const allStats = await prisma.stats.findMany({
      where: { userId },
      select: {
        focusTime: true,
        date: true,
      },
    });

    // Calculate total hours spent
    const totalSeconds = allStats.reduce(
      (acc, stat) => acc + stat.focusTime,
      0
    );
    const hoursSpent = Math.round((totalSeconds / 3600) * 10) / 10; // Round to 1 decimal

    // Calculate unique days and streak
    const dates = allStats.map((stat) => startOfDay(stat.date).toISOString());
    const uniqueDatesSet = new Set(dates);
    const uniqueDays = uniqueDatesSet.size;

    // Calculate current streak
    let currentStreak = 0;
    let today = startOfDay(new Date());
    while (uniqueDatesSet.has(today.toISOString())) {
      currentStreak++;
      today = subDays(today, 1);
    }

    return NextResponse.json({
      hoursSpent,
      daysAccessed: uniqueDays,
      currentStreak,
      lastActive: stats[0]?.updatedAt || new Date(),
      username: profile?.fullName || "Anonymous",
      avatarUrl: profile?.avatarUrl,
    });
  } catch (error) {
    console.error("[SUMMARY_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}
