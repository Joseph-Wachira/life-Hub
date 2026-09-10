import { db } from "@/lib/db";
import { positionBetween } from "@/lib/utils";
import type { GoalCategory, GoalStatus } from "@prisma/client";

/**
 * Pure progress calculation for a goal — no I/O, safe to unit test directly.
 *
 * Priority order:
 *  1. Milestones, when the goal has any: (completed / total) * 100.
 *  2. Linked, non-archived tasks, when there are no milestones: (done / total) * 100.
 *  3. Zero, when there is neither signal.
 */
export function computeGoalProgress(input: {
  milestones: { completedAt: Date | null }[];
  tasks: { status: string }[];
}): number {
  const { milestones, tasks } = input;

  if (milestones.length > 0) {
    const completed = milestones.filter((m) => m.completedAt !== null).length;
    return Math.round((completed / milestones.length) * 100);
  }

  const activeTasks = tasks.filter((t) => t.status !== "ARCHIVED");
  if (activeTasks.length > 0) {
    const done = activeTasks.filter((t) => t.status === "DONE").length;
    return Math.round((done / activeTasks.length) * 100);
  }

  return 0;
}

export async function listGoals(workspaceId: string) {
  return db.goal.findMany({
    where: { workspaceId },
    include: {
      milestones: { select: { completedAt: true } },
      tasks: { select: { status: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function getGoalDetail(workspaceId: string, goalId: string) {
  return db.goal.findFirst({
    where: { id: goalId, workspaceId },
    include: {
      milestones: { orderBy: { position: "asc" } },
      tasks: { orderBy: { updatedAt: "desc" } },
      projects: { orderBy: { updatedAt: "desc" } },
    },
  });
}

export async function createGoal(
  workspaceId: string,
  data: {
    title: string;
    description: string | null;
    category: GoalCategory;
    targetDate: Date | null;
    color?: string;
  }
) {
  return db.goal.create({
    data: {
      workspaceId,
      title: data.title,
      description: data.description,
      category: data.category,
      targetDate: data.targetDate,
      ...(data.color ? { color: data.color } : {}),
    },
  });
}

export async function updateGoal(
  workspaceId: string,
  goalId: string,
  data: {
    title: string;
    description: string | null;
    category: GoalCategory;
    targetDate: Date | null;
    color?: string;
  }
) {
  return db.goal.updateMany({
    where: { id: goalId, workspaceId },
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      targetDate: data.targetDate,
      ...(data.color ? { color: data.color } : {}),
    },
  });
}

export async function setGoalStatus(workspaceId: string, goalId: string, status: GoalStatus) {
  return db.goal.updateMany({ where: { id: goalId, workspaceId }, data: { status } });
}

export async function deleteGoal(workspaceId: string, goalId: string) {
  return db.goal.deleteMany({ where: { id: goalId, workspaceId } });
}

export async function createMilestone(
  workspaceId: string,
  goalId: string,
  data: { title: string; dueAt: Date | null }
) {
  const goal = await db.goal.findFirst({ where: { id: goalId, workspaceId }, select: { id: true } });
  if (!goal) return null;

  const last = await db.milestone.findFirst({ where: { goalId }, orderBy: { position: "desc" } });
  const position = positionBetween(last?.position ?? null, null);

  return db.milestone.create({ data: { goalId, title: data.title, dueAt: data.dueAt, position } });
}

export async function toggleMilestone(workspaceId: string, milestoneId: string, completed: boolean) {
  return db.milestone.updateMany({
    where: { id: milestoneId, goal: { workspaceId } },
    data: { completedAt: completed ? new Date() : null },
  });
}

export async function deleteMilestone(workspaceId: string, milestoneId: string) {
  return db.milestone.deleteMany({ where: { id: milestoneId, goal: { workspaceId } } });
}

export async function reorderMilestone(workspaceId: string, milestoneId: string, position: number) {
  return db.milestone.updateMany({
    where: { id: milestoneId, goal: { workspaceId } },
    data: { position },
  });
}
