import type { NextRequest } from "next/server";
import { z } from "zod";
import { listHabitsWithProgress, toggleHabitToday } from "@/lib/services/habits";
import { authenticateMobileRequest, requireMobileWorkspace } from "@/lib/mobile/auth";
import { toMobileHabit } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors, badRequest, notFound } from "@/lib/mobile/http";

const bodySchema = z.object({ workspaceId: z.string().min(1) });

export const POST = withMobileErrors(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { userId } = await authenticateMobileRequest(req);
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) throw badRequest("workspaceId is required.");
  const { workspaceId } = parsed.data;
  await requireMobileWorkspace(userId, workspaceId);

  await toggleHabitToday(workspaceId, id);

  const habits = await listHabitsWithProgress(workspaceId);
  const entry = habits.find((h) => h.habit.id === id);
  if (!entry) throw notFound("Habit not found.");

  return mobileJson(toMobileHabit(entry));
});
