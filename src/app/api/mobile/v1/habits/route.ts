import type { NextRequest } from "next/server";
import { z } from "zod";
import type { MobileHabit } from "@lifehub/shared";
import { listHabitsWithProgress } from "@/lib/services/habits";
import { authenticateMobileRequest, requireMobileWorkspace } from "@/lib/mobile/auth";
import { toMobileHabit } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors, badRequest } from "@/lib/mobile/http";

const querySchema = z.object({ workspaceId: z.string().min(1) });

export const GET = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw badRequest("workspaceId is required.");
  await requireMobileWorkspace(userId, parsed.data.workspaceId);

  const habits = await listHabitsWithProgress(parsed.data.workspaceId);
  return mobileJson<MobileHabit[]>(habits.map(toMobileHabit));
});
