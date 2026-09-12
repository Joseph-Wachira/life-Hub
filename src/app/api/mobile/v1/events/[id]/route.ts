import type { NextRequest } from "next/server";
import { z } from "zod";
import { getEventById } from "@/lib/services/events";
import { authenticateMobileRequest, requireMobileWorkspace } from "@/lib/mobile/auth";
import { toMobileEventRecord } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors, badRequest, notFound } from "@/lib/mobile/http";

const workspaceQuerySchema = z.object({ workspaceId: z.string().min(1) });

export const GET = withMobileErrors(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { userId } = await authenticateMobileRequest(req);
  const parsed = workspaceQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw badRequest("workspaceId is required.");
  await requireMobileWorkspace(userId, parsed.data.workspaceId);

  const event = await getEventById(parsed.data.workspaceId, id);
  if (!event) throw notFound("Event not found.");
  return mobileJson(toMobileEventRecord(event));
});
