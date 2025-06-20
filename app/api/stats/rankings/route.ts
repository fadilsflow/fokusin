import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { startOfDay, subDays } from "date-fns";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get page from query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalProfiles = await prisma.profile.count();

    // Get paginated profiles with their stats
    const [profiles, allStats] = await Promise.all([
      prisma.profile.findMany({
        select: {
          userId: true,
          fullName: true,
          avatarUrl: true,
        },
        skip,
        take: limit,
      }),
      prisma.stats.findMany({
        select: {
          userId: true,
          focusTime: true,
          date: true,
        },
      }),
    ]);

    // Group stats by user for efficient processing
    const userStatsMap = allStats.reduce((acc, stat) => {
      if (!acc[stat.userId]) {
        acc[stat.userId] = {
          totalFocusTime: 0,
          dates: new Set<string>(),
        };
      }
      acc[stat.userId].totalFocusTime += stat.focusTime;
      acc[stat.userId].dates.add(startOfDay(stat.date).toISOString());
      return acc;
    }, {} as Record<string, { totalFocusTime: number; dates: Set<string> }>);

    // Calculate rankings with streaks
    const rankings = profiles
      .map((profile) => {
        const stats = userStatsMap[profile.userId] || {
          totalFocusTime: 0,
          dates: new Set<string>(),
        };

        // Calculate streak
        let streak = 0;
        let today = startOfDay(new Date());
        while (stats.dates.has(today.toISOString())) {
          streak++;
          today = subDays(today, 1);
        }

        return {
          id: profile.userId,
          username: profile.fullName || "Anonymous",
          avatarUrl: profile.avatarUrl,
          totalFocusTime: stats.totalFocusTime,
          streak,
        };
      })
      .sort((a, b) => b.totalFocusTime - a.totalFocusTime);

    return NextResponse.json({
      users: rankings,
      total: totalProfiles,
    });
  } catch (error) {
    console.error("[RANKINGS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch rankings" },
      { status: 500 }
    );
  }
}
