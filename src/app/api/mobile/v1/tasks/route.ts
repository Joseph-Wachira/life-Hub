import type { NextRequest } from "next/server";
import { z } from "zod";
import { createTaskSchema, type MobileTask } from "@lifehub/shared";
import { listTasks, createTask, getNextPosition } from "@/lib/services/tasks";
import { positionBetween } from "@/lib/utils";
import { authenticateMobileRequest, requireMobileWorkspace } from "@/lib/mobile/auth";
import { toMobileTask } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors, badRequest } from "@/lib/mobile/http";

const listQuerySchema = z.object({
  workspaceId: z.string().min(1),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "ARCHIVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  projectId: z.string().min(1).optional(),
  search: z.string().trim().max(200).optional(),
});

export const GET = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const parsed = listQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw badRequest("Invalid query parameters.");
  const { workspaceId, status, priority, projectId, search } = parsed.data;
  await requireMobileWorkspace(userId, workspaceId);

  const tasks = await listTasks(workspaceId, { projectId });

  const filtered = tasks.filter((task) => {
    if (status ? task.status !== status : task.status === "ARCHIVED") return false;
    if (priority && task.priority !== priority) return false;
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return mobileJson<MobileTask[]>(filtered.map(toMobileTask));
});

const createBodySchema = createTaskSchema.extend({ workspaceId: z.string().min(1) });

export const POST = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const body = await req.json().catch(() => null);
  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) throw badRequest("Please check your input.", parsed.error.flatten().fieldErrors as Record<string, string[]>);

  const { workspaceId, title, description, priority, status, dueAt, projectId } = parsed.data;
  await requireMobileWorkspace(userId, workspaceId);

  const lastPosition = await getNextPosition(workspaceId, status);
  const task = await createTask({
    workspaceId,
    title,
    description: description ?? null,
    priority,
    status,
    dueAt: dueAt ?? null,
    projectId: projectId ?? null,
    goalId: null,
    tagIds: [],
    subtasks: [],
    attachments: [],
    position: positionBetween(lastPosition, null),
  });

  return mobileJson(toMobileTask(task), 201);
});
