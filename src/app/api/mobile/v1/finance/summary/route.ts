import type { NextRequest } from "next/server";
import { z } from "zod";
import { differenceInCalendarDays } from "date-fns";
import type { FinanceSnapshot } from "@lifehub/shared";
import { getMonthlyTotals, listBudgetsWithSpend, listRecurringBills, listCategories } from "@/lib/services/finance";
import { authenticateMobileRequest, requireMobileWorkspace } from "@/lib/mobile/auth";
import { toMobileBudget, toMobileCategory } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors, badRequest } from "@/lib/mobile/http";

const querySchema = z.object({ workspaceId: z.string().min(1) });

export const GET = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw badRequest("workspaceId is required.");
  const { workspaceId } = parsed.data;
  await requireMobileWorkspace(userId, workspaceId);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [totals, budgets, bills, categories] = await Promise.all([
    getMonthlyTotals(workspaceId, monthStart, monthEnd),
    listBudgetsWithSpend(workspaceId, monthStart, monthEnd),
    listRecurringBills(workspaceId),
    listCategories(workspaceId),
  ]);

  const billsDueSoon = bills
    .filter((bill) => differenceInCalendarDays(new Date(bill.nextDueDate), now) <= bill.reminderDaysBefore)
    .slice(0, 5)
    .map((bill) => ({
      id: bill.id,
      name: bill.name,
      amountCents: bill.amountCents,
      nextDueDate: bill.nextDueDate.toISOString(),
    }));

  const snapshot: FinanceSnapshot = {
    monthStart: monthStart.toISOString(),
    incomeCents: totals.incomeCents,
    expenseCents: totals.expenseCents,
    netCents: totals.incomeCents - totals.expenseCents,
    budgets: budgets.map(toMobileBudget),
    billsDueSoon,
    categories: categories.map(toMobileCategory),
  };
  return mobileJson(snapshot);
});
