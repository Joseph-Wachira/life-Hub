import type { NextRequest } from "next/server";
import { z } from "zod";
import { startFocusSessionSchema, type MobileFocusSession } from "@lifehub/shared";
import { startFocusSession, listRecentFocusSessions, getOpenTaskById } from "@/lib/services/focus";
import { authenticateMobileRequest, requireMobileWorkspace } from "@/lib/mobile/auth";
import { toMobileFocusSession } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors, badRequest } from "@/lib/mobile/http";

const listQuerySchema = z.object({
  workspaceId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const GET = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const parsed = listQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw badRequest("Invalid query parameters.");
  await requireMobileWorkspace(userId, parsed.data.workspaceId);

  const sessions = await listRecentFocusSessions(parsed.data.workspaceId, parsed.data.limit);
  return mobileJson<MobileFocusSession[]>(sessions.map((s) => toMobileFocusSession(s, s.task)));
});

const startBodySchema = startFocusSessionSchema.extend({ workspaceId: z.string().min(1) });

export const POST = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const body = await req.json().catch(() => null);
  const parsed = startBodySchema.safeParse(body);
  if (!parsed.success) throw badRequest("Please check your input.", parsed.error.flatten().fieldErrors as Record<string, string[]>);

  const { workspaceId, type, plannedMinutes, taskId } = parsed.data;
  await requireMobileWorkspace(userId, workspaceId);

  let task: { id: string; title: string } | null = null;
  if (taskId) {
    const found = await getOpenTaskById(workspaceId, taskId);
    if (!found) throw badRequest("Task not found in this workspace.");
    task = { id: found.id, title: found.title };
  }

  const session = await startFocusSession({ workspaceId, userId, type, plannedMinutes, taskId });
  return mobileJson(toMobileFocusSession(session, task), 201);
});
