import type { NextRequest } from "next/server";
import { z } from "zod";
import { endFocusSessionSchema } from "@lifehub/shared";
import { getFocusSessionById, endFocusSession } from "@/lib/services/focus";
import { authenticateMobileRequest, requireMobileWorkspace } from "@/lib/mobile/auth";
import { toMobileFocusSession } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors, badRequest, notFound } from "@/lib/mobile/http";

const patchBodySchema = endFocusSessionSchema.extend({ workspaceId: z.string().min(1) });

export const PATCH = withMobileErrors(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { userId } = await authenticateMobileRequest(req);
  const body = await req.json().catch(() => null);
  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) throw badRequest("Please check your input.", parsed.error.flatten().fieldErrors as Record<string, string[]>);

  const { workspaceId, actualMinutes, interruptions, rating, notes } = parsed.data;
  await requireMobileWorkspace(userId, workspaceId);

  const existing = await getFocusSessionById(workspaceId, id);
  if (!existing) throw notFound("Focus session not found.");

  // Idempotent on purpose: if this session was already ended (e.g. the
  // first PATCH succeeded but its response was lost, and the mobile
  // offline-mutation queue retried it), return the existing record instead
  // of erroring so a retried "end session" mutation can't surface as a
  // false failure.
  if (existing.endedAt) {
    return mobileJson(toMobileFocusSession(existing));
  }

  const updated = await endFocusSession(id, { actualMinutes, interruptions, rating, notes });
  return mobileJson(toMobileFocusSession(updated));
});
