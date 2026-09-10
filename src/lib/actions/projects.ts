"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/session";
import { createProject, updateProject, deleteProject } from "@/lib/services/projects";
import { projectFormSchema } from "@/lib/validations/projects";
import type { ActionResult } from "@/lib/actions/auth";

function readProjectForm(formData: FormData) {
  return projectFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    status: formData.get("status"),
    color: formData.get("color"),
    goalId: formData.get("goalId"),
    startAt: formData.get("startAt"),
    dueAt: formData.get("dueAt"),
  });
}

export async function createProjectAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = readProjectForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the project details." };
  }

  await createProject({
    workspaceId: workspace.id,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    status: parsed.data.status,
    color: parsed.data.color,
    goalId: parsed.data.goalId ?? null,
    startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : null,
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
  });

  revalidatePath("/projects");
  return { success: true };
}

export async function updateProjectAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing project id." };

  const existing = await db.project.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!existing) return { error: "Project not found." };

  const parsed = readProjectForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the project details." };
  }

  await updateProject(id, {
    workspaceId: workspace.id,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    status: parsed.data.status,
    color: parsed.data.color,
    goalId: parsed.data.goalId ?? null,
    startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : null,
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true };
}

export async function deleteProjectAction(projectId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const existing = await db.project.findFirst({ where: { id: projectId, workspaceId: workspace.id } });
  if (!existing) return { error: "Project not found." };

  await deleteProject(projectId);
  revalidatePath("/projects");
  return { success: true };
}
