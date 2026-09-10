"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/session";
import { db } from "@/lib/db";
import {
  createGoal,
  updateGoal,
  setGoalStatus,
  deleteGoal,
  createMilestone,
  toggleMilestone,
  deleteMilestone,
  reorderMilestone,
} from "@/lib/services/goals";
import { createGoalSchema, updateGoalSchema, createMilestoneSchema } from "@/lib/validations/goals";
import type { ActionResult } from "@/lib/actions/auth";
import type { GoalStatus } from "@prisma/client";

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createGoalAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();

  const parsed = createGoalSchema.safeParse({
    title: formData.get("title"),
    description: (formData.get("description") as string | null) ?? "",
    category: formData.get("category"),
    targetDate: (formData.get("targetDate") as string | null) || undefined,
    color: (formData.get("color") as string | null) || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  await createGoal(workspace.id, {
    title: parsed.data.title,
    description: parsed.data.description?.trim() ? parsed.data.description.trim() : null,
    category: parsed.data.category,
    targetDate: parseDate(parsed.data.targetDate),
    color: parsed.data.color,
  });

  revalidatePath("/goals");
  return { success: true };
}

export async function updateGoalAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();

  const parsed = updateGoalSchema.safeParse({
    goalId: formData.get("goalId"),
    title: formData.get("title"),
    description: (formData.get("description") as string | null) ?? "",
    category: formData.get("category"),
    targetDate: (formData.get("targetDate") as string | null) || undefined,
    color: (formData.get("color") as string | null) || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  await updateGoal(workspace.id, parsed.data.goalId, {
    title: parsed.data.title,
    description: parsed.data.description?.trim() ? parsed.data.description.trim() : null,
    category: parsed.data.category,
    targetDate: parseDate(parsed.data.targetDate),
    color: parsed.data.color,
  });

  revalidatePath("/goals");
  revalidatePath(`/goals/${parsed.data.goalId}`);
  return { success: true };
}

export async function setGoalStatusAction(goalId: string, status: GoalStatus): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  await setGoalStatus(workspace.id, goalId, status);
  revalidatePath("/goals");
  revalidatePath(`/goals/${goalId}`);
  return { success: true };
}

export async function deleteGoalAction(goalId: string) {
  const { workspace } = await requireWorkspace();
  await deleteGoal(workspace.id, goalId);
  revalidatePath("/goals");
  redirect("/goals");
}

export async function createMilestoneAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();

  const parsed = createMilestoneSchema.safeParse({
    goalId: formData.get("goalId"),
    title: formData.get("title"),
    dueAt: (formData.get("dueAt") as string | null) || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const milestone = await createMilestone(workspace.id, parsed.data.goalId, {
    title: parsed.data.title,
    dueAt: parseDate(parsed.data.dueAt),
  });
  if (!milestone) {
    return { error: "That goal could not be found." };
  }

  revalidatePath(`/goals/${parsed.data.goalId}`);
  revalidatePath("/goals");
  return { success: true };
}

export async function toggleMilestoneAction(
  goalId: string,
  milestoneId: string,
  completed: boolean
): Promise<ActionResult> {
  const { userId, workspace } = await requireWorkspace();
  await toggleMilestone(workspace.id, milestoneId, completed);

  if (completed) {
    const [milestone, prefs] = await Promise.all([
      db.milestone.findUnique({ where: { id: milestoneId }, select: { title: true } }),
      db.notificationPreference.findUnique({ where: { userId } }),
    ]);
    if (milestone && (prefs?.goalUpdates ?? true)) {
      await db.notification.create({
        data: {
          userId,
          workspaceId: workspace.id,
          type: "GOAL_MILESTONE",
          title: `You completed a milestone: "${milestone.title}"`,
          entityType: "Milestone",
          entityId: milestoneId,
          scheduledFor: new Date(),
          isRead: false,
        },
      });
    }
  }

  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/goals");
  return { success: true };
}

export async function deleteMilestoneAction(goalId: string, milestoneId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  await deleteMilestone(workspace.id, milestoneId);
  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/goals");
  return { success: true };
}

export async function reorderMilestoneAction(
  goalId: string,
  milestoneId: string,
  position: number
): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  await reorderMilestone(workspace.id, milestoneId, position);
  revalidatePath(`/goals/${goalId}`);
  return { success: true };
}
