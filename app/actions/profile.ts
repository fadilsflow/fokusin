import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function createOrUpdateProfile() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return null; // Return null instead of throwing error for better error handling
    }

    // Use upsert to either create or update in a single query
    return await prisma.profile.upsert({
      where: {
        userId: userId,
      },
      update: {
        fullName: user.fullName,
        avatarUrl: user.imageUrl,
        updatedAt: new Date(),
      },
      create: {
        userId: userId,
        fullName: user.fullName,
        avatarUrl: user.imageUrl,
      },
    });
  } catch (error) {
    console.error("[PROFILE_UPSERT_ERROR]", error);
    return null; // Return null instead of throwing for better error handling
  }
}
