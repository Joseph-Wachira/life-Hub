import type { NextRequest } from "next/server";
import { z } from "zod";
import { createNoteSchema, notesQuerySchema, type MobileNote } from "@lifehub/shared";
import { listNotes, createNote, updateNote } from "@/lib/services/notes";
import { authenticateMobileRequest, requireMobileWorkspace } from "@/lib/mobile/auth";
import { toMobileNote } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors, badRequest, notFound } from "@/lib/mobile/http";

export const GET = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const parsed = notesQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw badRequest("Invalid query parameters.");
  const { workspaceId, q, onlyPinned } = parsed.data;
  await requireMobileWorkspace(userId, workspaceId);

  const notes = await listNotes(workspaceId, { query: q, onlyPinned });
  return mobileJson<MobileNote[]>(notes.map(toMobileNote));
});

const createBodySchema = createNoteSchema.extend({ workspaceId: z.string().min(1) });

export const POST = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const body = await req.json().catch(() => null);
  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) throw badRequest("Please check your input.", parsed.error.flatten().fieldErrors as Record<string, string[]>);

  const { workspaceId, title, contentMd } = parsed.data;
  await requireMobileWorkspace(userId, workspaceId);

  // createNote() always starts a note as "Untitled note" / "" (matching the
  // web app's autosave-from-empty flow) — a quick note fills in the content
  // right away with an immediate follow-up update.
  const created = await createNote(workspaceId, null);
  const note =
    title !== undefined || contentMd !== undefined
      ? await updateNote(workspaceId, created.id, { title, contentMd })
      : created;
  if (!note) throw notFound("Note not found.");

  return mobileJson(toMobileNote({ ...note, tags: [] }), 201);
});
