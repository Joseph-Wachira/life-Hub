import type { NextRequest } from "next/server";
import { z } from "zod";
import { createEventSchema, eventRangeQuerySchema, type MobileEventOccurrence } from "@lifehub/shared";
import { listEventInstancesInRange, createEvent } from "@/lib/services/events";
import { authenticateMobileRequest, requireMobileWorkspace } from "@/lib/mobile/auth";
import { toMobileEventInstance, toMobileEventRecord } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors, badRequest } from "@/lib/mobile/http";

export const GET = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const parsed = eventRangeQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw badRequest("workspaceId, from and to are required.");
  const { workspaceId, from, to } = parsed.data;
  await requireMobileWorkspace(userId, workspaceId);

  const instances = await listEventInstancesInRange(workspaceId, from, to);
  return mobileJson<MobileEventOccurrence[]>(instances.map(toMobileEventInstance));
});

const createBodySchema = createEventSchema.extend({ workspaceId: z.string().min(1) });

export const POST = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const body = await req.json().catch(() => null);
  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) throw badRequest("Please check your input.", parsed.error.flatten().fieldErrors as Record<string, string[]>);

  const { workspaceId, title, description, location, startAt, endAt, allDay, color } = parsed.data;
  await requireMobileWorkspace(userId, workspaceId);

  const event = await createEvent(workspaceId, {
    title,
    description: description ?? null,
    location: location ?? null,
    startAt,
    endAt,
    allDay,
    color,
    recurrenceRuleJson: null,
    recurrenceEndAt: null,
    reminderMinutesBefore: null,
  });

  return mobileJson(toMobileEventRecord(event), 201);
});
