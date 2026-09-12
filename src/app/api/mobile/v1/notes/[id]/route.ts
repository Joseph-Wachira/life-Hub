import type { NextRequest } from "next/server";
import { z } from "zod";
import { updateNoteSchema } from "@lifehub/shared";
import { getNote, updateNote } from "@/lib/services/notes";
import { authenticateMobileRequest, requireMobileWorkspace } from "@/lib/mobile/auth";
import { toMobileNote } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors, badRequest, notFound } from "@/lib/mobile/http";

const workspaceQuerySchema = z.object({ workspaceId: z.string().min(1) });

export const GET = withMobileErrors(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { userId } = await authenticateMobileRequest(req);
  const parsed = workspaceQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw badRequest("workspaceId is required.");
  await requireMobileWorkspace(userId, parsed.data.workspaceId);

  const note = await getNote(parsed.data.workspaceId, id);
  if (!note) throw notFound("Note not found.");
  return mobileJson(toMobileNote(note));
});

const patchBodySchema = updateNoteSchema.extend({ workspaceId: z.string().min(1) });

export const PATCH = withMobileErrors(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { userId } = await authenticateMobileRequest(req);
  const body = await req.json().catch(() => null);
  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) throw badRequest("Please check your input.", parsed.error.flatten().fieldErrors as Record<string, string[]>);

  const { workspaceId, ...patch } = parsed.data;
  await requireMobileWorkspace(userId, workspaceId);

  const updated = await updateNote(workspaceId, id, patch);
  if (!updated) throw notFound("Note not found.");

  const withTags = await getNote(workspaceId, id);
  return mobileJson(toMobileNote(withTags ?? { ...updated, tags: [] }));
});
