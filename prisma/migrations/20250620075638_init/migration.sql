-- CreateTable
CREATE TABLE "Stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "focusTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pomodoroTime" INTEGER NOT NULL DEFAULT 25,
    "shortBreakTime" INTEGER NOT NULL DEFAULT 5,
    "longBreakTime" INTEGER NOT NULL DEFAULT 15,
    "autoStartBreaks" BOOLEAN NOT NULL DEFAULT false,
    "autoStartPomodoros" BOOLEAN NOT NULL DEFAULT false,
    "longBreakInterval" INTEGER NOT NULL DEFAULT 4,
    "pomodoroColor" TEXT NOT NULL DEFAULT 'oklch(0.3635 0.0554 277.8)',
    "shortBreakColor" TEXT NOT NULL DEFAULT 'oklch(0.5406 0.067 196.69)',
    "longBreakColor" TEXT NOT NULL DEFAULT 'oklch(0.4703 0.0888 247.87)',
    "alarmRepeat" INTEGER NOT NULL DEFAULT 1,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "alarmSound" TEXT NOT NULL DEFAULT 'alarm-bell.mp3',
    "backsound" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Stats_userId_idx" ON "Stats"("userId");

-- CreateIndex
CREATE INDEX "Stats_date_idx" ON "Stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Stats_userId_date_key" ON "Stats"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");
