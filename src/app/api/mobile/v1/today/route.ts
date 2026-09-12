import type { NextRequest } from "next/server";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import type { TodaySummary } from "@lifehub/shared";
import { listEventInstancesInRange } from "@/lib/services/events";
import { listTasks } from "@/lib/services/tasks";
import { listHabitsWithProgress } from "@/lib/services/habits";
import { getFocusAnalytics } from "@/lib/services/focus";
import { getMonthlyTotals, listBudgetsWithSpend } from "@/lib/services/finance";
import { authenticateMobileRequest, requireMobileWorkspace } from "@/lib/mobile/auth";
import { toMobileEventInstance, toMobileTask, toMobileHabit } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors, badRequest } from "@/lib/mobile/http";

// Same ranking used by the web dashboard (src/app/(app)/dashboard/page.tsx) —
// kept as a small local copy rather than a shared helper since it's
// presentation logic, not data access, and each surface owns its own view.
const PRIORITY_RANK: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

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

  const [agenda, allTasks, habits, focusAnalytics, monthlyTotals, budgets] = await Promise.all([
    listEventInstancesInRange(workspaceId, startOfDay(now), endOfDay(now)),
    listTasks(workspaceId),
    listHabitsWithProgress(workspaceId, now),
    getFocusAnalytics(workspaceId, now),
    getMonthlyTotals(workspaceId, monthStart, monthEnd),
    listBudgetsWithSpend(workspaceId, monthStart, monthEnd),
  ]);

  const openTasks = allTasks.filter((task) => task.status !== "DONE" && task.status !== "ARCHIVED");
  const overdueTasks = openTasks.filter((task) => task.dueAt && new Date(task.dueAt) < now);
  const priorityTasks = [...openTasks]
    .sort((a, b) => {
      const rankDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (rankDiff !== 0) return rankDiff;
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    })
    .slice(0, 5);

  const overBudget = budgets.filter((budget) => budget.spentCents > budget.monthlyLimitCents);

  const summary: TodaySummary = {
    agenda: agenda.map(toMobileEventInstance),
    priorityTasks: priorityTasks.map(toMobileTask),
    overdueTaskCount: overdueTasks.length,
    habits: habits.map(toMobileHabit),
    focus: { sessionsToday: focusAnalytics.sessionsToday, weekMinutes: focusAnalytics.weekMinutes },
    finance: {
      netCents: monthlyTotals.incomeCents - monthlyTotals.expenseCents,
      incomeCents: monthlyTotals.incomeCents,
      expenseCents: monthlyTotals.expenseCents,
      overBudgetCount: overBudget.length,
    },
  };

  return mobileJson(summary);
});
