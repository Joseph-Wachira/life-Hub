import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/session";
import { listTransactions, listCategories } from "@/lib/services/finance";
import { TransactionsList } from "@/components/finance/transactions-list";

export const metadata: Metadata = { title: "Transactions · Finance" };

export default async function TransactionsPage() {
  const { workspace } = await requireWorkspace();
  const [transactions, categories] = await Promise.all([
    listTransactions(workspace.id),
    listCategories(workspace.id),
  ]);

  return <TransactionsList transactions={transactions} categories={categories} />;
}
