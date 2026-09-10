import { db } from "@/lib/db";
import type { ProjectStatus } from "@prisma/client";

export async function listProjects(workspaceId: string) {
  const projects = await db.project.findMany({
    where: { workspaceId },
    include: {
      tasks: {
        where: { parentTaskId: null, status: { not: "ARCHIVED" } },
        select: { status: true },
      },
      goal: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return projects.map(({ tasks, ...project }) => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "DONE").length;
    return {
      ...project,
      taskCount: total,
      doneCount: done,
      progress: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  });
}

export async function getProject(id: string, workspaceId: string) {
  return db.project.findFirst({
    where: { id, workspaceId },
    include: { goal: { select: { id: true, title: true } } },
  });
}

export async function getProjectProgress(id: string) {
  const tasks = await db.task.findMany({
    where: { projectId: id, parentTaskId: null, status: { not: "ARCHIVED" } },
    select: { status: true },
  });
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  return { taskCount: total, doneCount: done, progress: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export interface ProjectWriteData {
  workspaceId: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  color: string;
  goalId?: string | null;
  startAt?: Date | null;
  dueAt?: Date | null;
}

export async function createProject(data: ProjectWriteData) {
  return db.project.create({
    data: {
      workspaceId: data.workspaceId,
      name: data.name,
      description: data.description ?? null,
      status: data.status,
      color: data.color,
      goalId: data.goalId ?? null,
      startAt: data.startAt ?? null,
      dueAt: data.dueAt ?? null,
    },
  });
}

export async function updateProject(id: string, data: ProjectWriteData) {
  return db.project.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description ?? null,
      status: data.status,
      color: data.color,
      goalId: data.goalId ?? null,
      startAt: data.startAt ?? null,
      dueAt: data.dueAt ?? null,
    },
  });
}

export async function deleteProject(id: string) {
  return db.project.delete({ where: { id } });
}
