import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/session";
import { listRecurringBills, listCategories } from "@/lib/services/finance";
import { BillsList } from "@/components/finance/bills-list";

export const metadata: Metadata = { title: "Bills · Finance" };

export default async function BillsPage() {
  const { workspace } = await requireWorkspace();
  const [bills, categories] = await Promise.all([
    listRecurringBills(workspace.id),
    listCategories(workspace.id, "EXPENSE"),
  ]);

  return <BillsList bills={bills} categories={categories} />;
}
