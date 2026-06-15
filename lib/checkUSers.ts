import { Plan } from "@/types/plans";
import { currentUser, auth } from "@clerk/nextjs/server";
import { db } from "./prisma";
import { PLANS } from "./constants";
 // adjust path as needed

const getCurrentPlan = async (): Promise<Plan> => {
  const { has } = await auth();

  if (has({ plan: "pro" })) return "pro";
  if (has({ plan: "starter" })) return "starter";

  return "free";
};

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) return null;

  try {
    const currentPlan = await getCurrentPlan();

    const existing = await db.user.findUnique({
      where: {
        clerkId: user.id,
      },
    });

    if (existing) {
      // Plan changed → add credits from the new plan
      if (existing.plan !== currentPlan) {
        return await db.user.update({
          where: {
            clerkId: user.id,
          },
          data: {
            plan: currentPlan,
            credits: existing.credits + PLANS[currentPlan].credits,
          },
        });
      }

      return existing;
    }

    // Create new user
    return await db.user.create({
      data: {
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? "",
        imageUrl: user.imageUrl ?? "",
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        plan: "free",
        credits: PLANS.free.credits,
      },
    });
  } catch (error) {
    console.error("Error checking user:", error);
    throw error;
  }
};