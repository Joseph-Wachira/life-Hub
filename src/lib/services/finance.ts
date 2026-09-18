import { db } from "@/lib/db";
import type { BillFrequency, TransactionType } from "@prisma/client";

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export type CategoryInput = { name: string; type: TransactionType; color: string };

export async function listCategories(workspaceId: string, type?: TransactionType) {
  return db.category.findMany({
    where: { workspaceId, ...(type ? { type } : {}) },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(workspaceId: string, data: CategoryInput) {
  return db.category.create({ data: { workspaceId, ...data } });
}

export async function updateCategory(workspaceId: string, id: string, data: Partial<CategoryInput>) {
  const existing = await db.category.findFirst({ where: { id, workspaceId }, select: { id: true } });
  if (!existing) return null;
  return db.category.update({ where: { id }, data });
}

export async function deleteCategory(workspaceId: string, id: string) {
  return db.category.deleteMany({ where: { id, workspaceId } });
}

/* -------------------------------------------------------------------------- */
/* Transactions                                                                */
/* -------------------------------------------------------------------------- */

export type TransactionFilters = {
  type?: TransactionType;
  categoryId?: string;
  from?: Date;
  to?: Date;
  search?: string;
};

export type TransactionInput = {
  type: TransactionType;
  amountCents: number;
  categoryId?: string | null;
  description?: string | null;
  occurredAt: Date;
};

export async function listTransactions(workspaceId: string, filters: TransactionFilters = {}) {
  return db.transaction.findMany({
    where: {
      workspaceId,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.from || filters.to
        ? {
            occurredAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
      ...(filters.search ? { description: { contains: filters.search } } : {}),
    },
    include: { category: true },
    orderBy: { occurredAt: "desc" },
  });
}

export async function createTransaction(workspaceId: string, data: TransactionInput) {
  return db.transaction.create({ data: { workspaceId, ...data } });
}

export async function updateTransaction(workspaceId: string, id: string, data: Partial<TransactionInput>) {
  return db.transaction.updateMany({ where: { id, workspaceId }, data });
}

export async function deleteTransaction(workspaceId: string, id: string) {
  return db.transaction.deleteMany({ where: { id, workspaceId } });
}

/** Total income/expense across a date range, scoped to the workspace. */
export async function getMonthlyTotals(workspaceId: string, start: Date, end: Date) {
  const rows = await db.transaction.findMany({
    where: { workspaceId, occurredAt: { gte: start, lte: end } },
    select: { type: true, amountCents: true },
  });
  let incomeCents = 0;
  let expenseCents = 0;
  for (const row of rows) {
    if (row.type === "INCOME") incomeCents += row.amountCents;
    else expenseCents += row.amountCents;
  }
  return { incomeCents, expenseCents };
}

export type CategorySpend = { categoryId: string | null; name: string; color: string; amountCents: number };

/** Expense totals grouped by category for a date range (used by the overview donut). */
export async function getSpendingByCategory(
  workspaceId: string,
  start: Date,
  end: Date
): Promise<CategorySpend[]> {
  const rows = await db.transaction.findMany({
    where: { workspaceId, type: "EXPENSE", occurredAt: { gte: start, lte: end } },
    select: { amountCents: true, category: { select: { id: true, name: true, color: true } } },
  });

  const byCategory = new Map<string, CategorySpend>();
  let uncategorizedCents = 0;

  for (const row of rows) {
    if (!row.category) {
      uncategorizedCents += row.amountCents;
      continue;
    }
    const existing = byCategory.get(row.category.id);
    if (existing) existing.amountCents += row.amountCents;
    else
      byCategory.set(row.category.id, {
        categoryId: row.category.id,
        name: row.category.name,
        color: row.category.color,
        amountCents: row.amountCents,
      });
  }

  const result = Array.from(byCategory.values()).sort((a, b) => b.amountCents - a.amountCents);
  if (uncategorizedCents > 0) {
    result.push({ categoryId: null, name: "Uncategorized", color: "#8a8f98", amountCents: uncategorizedCents });
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/* Budgets                                                                     */
/* -------------------------------------------------------------------------- */

export type BudgetInput = { categoryId: string; monthlyLimitCents: number };

export async function listBudgets(workspaceId: string) {
  return db.budget.findMany({
    where: { workspaceId },
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });
}

/** Budgets for the workspace, each with how much was spent this period against it. */
export async function listBudgetsWithSpend(workspaceId: string, start: Date, end: Date) {
  const [budgets, spend] = await Promise.all([
    listBudgets(workspaceId),
    getSpendingByCategory(workspaceId, start, end),
  ]);
  const spendMap = new Map(spend.map((s) => [s.categoryId, s.amountCents]));
  return budgets.map((budget) => ({
    ...budget,
    spentCents: spendMap.get(budget.categoryId) ?? 0,
  }));
}

export async function createBudget(workspaceId: string, data: BudgetInput) {
  return db.budget.create({ data: { workspaceId, ...data } });
}

export async function updateBudget(workspaceId: string, id: string, data: { monthlyLimitCents: number }) {
  return db.budget.updateMany({ where: { id, workspaceId }, data });
}

export async function deleteBudget(workspaceId: string, id: string) {
  return db.budget.deleteMany({ where: { id, workspaceId } });
}

/* -------------------------------------------------------------------------- */
/* Recurring bills                                                             */
/* -------------------------------------------------------------------------- */

export type RecurringBillInput = {
  name: string;
  amountCents: number;
  categoryId?: string | null;
  frequency: BillFrequency;
  nextDueDate: Date;
  autoPay: boolean;
  reminderDaysBefore: number;
};

export async function listRecurringBills(workspaceId: string) {
  return db.recurringBill.findMany({
    where: { workspaceId },
    include: { category: true },
    orderBy: { nextDueDate: "asc" },
  });
}

export async function createRecurringBill(workspaceId: string, data: RecurringBillInput) {
  return db.recurringBill.create({ data: { workspaceId, ...data } });
}

export async function updateRecurringBill(
  workspaceId: string,
  id: string,
  data: Partial<RecurringBillInput>
) {
  return db.recurringBill.updateMany({ where: { id, workspaceId }, data });
}

export async function deleteRecurringBill(workspaceId: string, id: string) {
  return db.recurringBill.deleteMany({ where: { id, workspaceId } });
}

export async function setRecurringBillAutoPay(workspaceId: string, id: string, autoPay: boolean) {
  return db.recurringBill.updateMany({ where: { id, workspaceId }, data: { autoPay } });
}

/* -------------------------------------------------------------------------- */
/* Savings goals                                                               */
/* -------------------------------------------------------------------------- */

export type SavingsGoalInput = {
  name: string;
  targetAmountCents: number;
  targetDate?: Date | null;
  color: string;
};

export async function listSavingsGoals(workspaceId: string) {
  return db.savingsGoal.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } });
}

export async function createSavingsGoal(workspaceId: string, data: SavingsGoalInput) {
  return db.savingsGoal.create({ data: { workspaceId, ...data } });
}

export async function updateSavingsGoal(
  workspaceId: string,
  id: string,
  data: Partial<SavingsGoalInput>
) {
  return db.savingsGoal.updateMany({ where: { id, workspaceId }, data });
}

export async function deleteSavingsGoal(workspaceId: string, id: string) {
  return db.savingsGoal.deleteMany({ where: { id, workspaceId } });
}

export async function contributeSavingsGoal(workspaceId: string, id: string, amountCents: number) {
  const goal = await db.savingsGoal.findFirstOrThrow({ where: { id, workspaceId } });
  return db.savingsGoal.updateMany({
    where: { id, workspaceId },
    data: { currentAmountCents: goal.currentAmountCents + amountCents },
  });
}
