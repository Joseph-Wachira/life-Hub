"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/session";
import { parseEventFormData } from "@/lib/validations/events";
import { createEvent, deleteEvent, getEventById, moveEvent, updateEvent } from "@/lib/services/events";
import type { ActionResult } from "@/lib/actions/auth";

export async function createEventAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();

  const parsed = parseEventFormData(formData);
  if (!parsed.success) return { error: parsed.error };

  await createEvent(workspace.id, parsed.data);
  revalidatePath("/calendar");
  return { success: true };
}

export async function updateEventAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing event id." };

  const existing = await getEventById(workspace.id, id);
  if (!existing) return { error: "This event no longer exists." };

  const parsed = parseEventFormData(formData);
  if (!parsed.success) return { error: parsed.error };

  await updateEvent(workspace.id, id, parsed.data);
  revalidatePath("/calendar");
  return { success: true };
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const ok = await deleteEvent(workspace.id, id);
  if (!ok) return { error: "This event no longer exists." };
  revalidatePath("/calendar");
  return { success: true };
}

/** Used by drag-and-drop: moves an event (or an entire recurring series) to a new start/end, keeping duration. */
export async function moveEventAction(id: string, newStartIso: string, newEndIso: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();

  const newStart = new Date(newStartIso);
  const newEnd = new Date(newEndIso);
  if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
    return { error: "Invalid date." };
  }

  const ok = await moveEvent(workspace.id, id, newStart, newEnd);
  if (!ok) return { error: "This event no longer exists." };
  revalidatePath("/calendar");
  return { success: true };
}
