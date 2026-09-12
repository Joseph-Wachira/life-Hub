import type { NextRequest } from "next/server";
import { z } from "zod";
import { createTransactionSchema, transactionsQuerySchema, type MobileTransaction } from "@lifehub/shared";
import { listTransactions, createTransaction, listCategories } from "@/lib/services/finance";
import { authenticateMobileRequest, requireMobileWorkspace } from "@/lib/mobile/auth";
import { toMobileTransaction } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors, badRequest } from "@/lib/mobile/http";

export const GET = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const parsed = transactionsQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw badRequest("Invalid query parameters.");
  const { workspaceId, limit } = parsed.data;
  await requireMobileWorkspace(userId, workspaceId);

  const transactions = await listTransactions(workspaceId);
  return mobileJson<MobileTransaction[]>(transactions.slice(0, limit).map(toMobileTransaction));
});

const createBodySchema = createTransactionSchema.extend({ workspaceId: z.string().min(1) });

export const POST = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const body = await req.json().catch(() => null);
  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) throw badRequest("Please check your input.", parsed.error.flatten().fieldErrors as Record<string, string[]>);

  const { workspaceId, type, amountCents, categoryId, description, occurredAt } = parsed.data;
  await requireMobileWorkspace(userId, workspaceId);

  const transaction = await createTransaction(workspaceId, {
    type,
    amountCents,
    categoryId: categoryId ?? null,
    description: description ?? null,
    occurredAt,
  });

  // createTransaction() doesn't return the category relation, and the
  // mobile card needs the category's name/color — look it up from the id
  // the caller already validated rather than re-fetching the transaction.
  const category = categoryId
    ? ((await listCategories(workspaceId)).find((c) => c.id === categoryId) ?? null)
    : null;

  return mobileJson(toMobileTransaction({ ...transaction, category }), 201);
});
