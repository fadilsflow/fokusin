import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for settings
const settingsSchema = z.object({
  pomodoroTime: z.number().min(1).max(999),
  shortBreakTime: z.number().min(1).max(999),
  longBreakTime: z.number().min(1).max(999),
  autoStartBreaks: z.boolean(),
  autoStartPomodoros: z.boolean(),
  longBreakInterval: z.number().min(1).max(999),
  pomodoroColor: z.string(),
  shortBreakColor: z.string(),
  longBreakColor: z.string(),
  volume: z.number().min(0).max(1),
  alarmSound: z.string(),
  backsound: z.string(),
  alarmRepeat: z.number().min(1).max(10),
});

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        pomodoroTime: 25,
        shortBreakTime: 5,
        longBreakTime: 15,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        longBreakInterval: 4,
        pomodoroColor: "oklch(0.3635 0.0554 277.8)",
        shortBreakColor: "oklch(0.5406 0.067 196.69)",
        longBreakColor: "oklch(0.4703 0.0888 247.87)",
        volume: 1,
        alarmSound: "alarm-bell.mp3",
        backsound: "",
        alarmRepeat: 1,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[SETTINGS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validatedSettings = settingsSchema.safeParse(body);

    if (!validatedSettings.success) {
      return NextResponse.json(
        { error: "Invalid settings data" },
        { status: 400 }
      );
    }

    const settings = await prisma.settings.upsert({
      where: { userId },
      update: {
        ...validatedSettings.data,
        updatedAt: new Date(),
      },
      create: {
        userId,
        ...validatedSettings.data,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[SETTINGS_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
