import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = { title: "Welcome · Life Hub" };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.onboardingProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (profile?.completedAt) redirect("/dashboard");

  return <OnboardingWizard />;
}
