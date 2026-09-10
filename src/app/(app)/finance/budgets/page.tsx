import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/session";
import { listBudgetsWithSpend, listCategories } from "@/lib/services/finance";
import { BudgetsList } from "@/components/finance/budgets-list";

export const metadata: Metadata = { title: "Budgets · Finance" };

export default async function BudgetsPage() {
  const { workspace } = await requireWorkspace();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [budgets, categories] = await Promise.all([
    listBudgetsWithSpend(workspace.id, start, end),
    listCategories(workspace.id, "EXPENSE"),
  ]);

  return <BudgetsList budgets={budgets} expenseCategories={categories} />;
}
