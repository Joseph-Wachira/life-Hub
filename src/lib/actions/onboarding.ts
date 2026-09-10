"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { onboardingSchema } from "@/lib/validations/onboarding";
import { createStarterContent } from "@/lib/services/onboarding";
import type { ActionResult } from "@/lib/actions/auth";

export async function completeOnboardingAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = onboardingSchema.safeParse({
    focusAreas: formData.getAll("focusAreas"),
    role: formData.get("role") || undefined,
    workspaceName: formData.get("workspaceName"),
    workspaceType: formData.get("workspaceType"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please complete every step." };
  }

  const { focusAreas, role, workspaceName, workspaceType } = parsed.data;
  const userId = session.user.id;

  const workspace = await db.workspace.create({
    data: {
      userId,
      name: workspaceName,
      type: workspaceType,
      isDefault: true,
    },
  });

  await db.onboardingProfile.upsert({
    where: { userId },
    create: {
      userId,
      focusAreasJson: JSON.stringify(focusAreas),
      role,
      completedAt: new Date(),
    },
    update: {
      focusAreasJson: JSON.stringify(focusAreas),
      role,
      completedAt: new Date(),
    },
  });

  await createStarterContent(workspace.id, focusAreas);

  redirect("/dashboard");
}
