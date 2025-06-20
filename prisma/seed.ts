import { PrismaClient } from "@prisma/client";
import { subDays, startOfDay } from "date-fns";

const prisma = new PrismaClient();

const AVATAR_URL =
  "https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ2l0aHViL2ltZ18yeWxKdUdLUXFvQ0oyU2NDYkRESkJCTkVuRjMifQ";

// Generate random focus time between 1 to 4 hours (in seconds)
const generateFocusTime = () =>
  Math.floor(Math.random() * (4 * 3600 - 3600) + 3600);

// Generate sequential dates within the last 30 days
const generateDates = (count: number): Date[] => {
  const dates = new Set<string>();
  const today = startOfDay(new Date());
  let attempts = 0;

  while (dates.size < count && attempts < 30) {
    const daysAgo = attempts;
    const date = subDays(today, daysAgo);
    dates.add(date.toISOString());
    attempts++;
  }

  return Array.from(dates).map((d) => new Date(d));
};

// Generate a random name
const generateName = () => {
  const firstNames = [
    "Alex",
    "Jordan",
    "Taylor",
    "Morgan",
    "Casey",
    "Riley",
    "Sam",
    "Avery",
    "Quinn",
    "Parker",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
  ];

  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
    lastNames[Math.floor(Math.random() * lastNames.length)]
  }`;
};

async function main() {
  console.log("Starting seed...");

  try {
    // Delete existing data
    await prisma.stats.deleteMany();
    await prisma.profile.deleteMany();

    // Create 50 users with profiles and stats
    for (let i = 0; i < 50; i++) {
      const userId = `dummy-user-${i + 1}`;
      const name = generateName();

      // Create profile
      await prisma.profile.create({
        data: {
          userId,
          fullName: name,
          avatarUrl: AVATAR_URL,
        },
      });

      // Generate random number of active days (5-15 days)
      const numDays = Math.floor(Math.random() * 10) + 5;
      const activeDays = generateDates(numDays);

      // Create stats for each active day
      await Promise.all(
        activeDays.map((date) =>
          prisma.stats.create({
            data: {
              userId,
              date,
              focusTime: generateFocusTime(),
              createdAt: date,
              updatedAt: date,
            },
          })
        )
      );

      console.log(
        `Created user ${i + 1}/50: ${name} with ${
          activeDays.length
        } days of stats`
      );
    }

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Detailed error:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
