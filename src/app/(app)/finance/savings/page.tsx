import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/session";
import { listSavingsGoals } from "@/lib/services/finance";
import { SavingsGoalsList } from "@/components/finance/savings-goals-list";

export const metadata: Metadata = { title: "Savings · Finance" };

export default async function SavingsPage() {
  const { workspace } = await requireWorkspace();
  const goals = await listSavingsGoals(workspace.id);
  return <SavingsGoalsList goals={goals} />;
}
