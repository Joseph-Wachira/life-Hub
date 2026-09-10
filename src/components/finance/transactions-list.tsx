"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { TransactionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deleteTransactionAction } from "@/lib/actions/finance";
import { TransactionFormDialog, type TransactionRecord } from "./transaction-form-dialog";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import type { CategoryOption } from "./category-select";

interface TransactionRow extends TransactionRecord {
  category: { name: string; color: string } | null;
}

export function TransactionsList({
  transactions,
  categories,
}: {
  transactions: TransactionRow[];
  categories: CategoryOption[];
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const [deleting, setDeleting] = useState<TransactionRow | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== "ALL" && t.type !== typeFilter) return false;
      if (categoryFilter !== "ALL" && t.categoryId !== categoryFilter) return false;
      if (search.trim() && !(t.description ?? "").toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [transactions, search, typeFilter, categoryFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--subtle-foreground)]" />
            <Input placeholder="Search descriptions…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TransactionType | "ALL")}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> Add transaction
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Plus}
          title={transactions.length === 0 ? "No transactions yet" : "No matches"}
          description={
            transactions.length === 0
              ? "Log your first income or expense to start tracking your finances."
              : "Try a different search or filter."
          }
        />
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
          {filtered.map((t) => (
            <div key={t.id} className="group flex items-center gap-3 bg-[var(--surface)] px-4 py-3">
              <span
                className={
                  t.type === "INCOME"
                    ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--success)]/15 text-[var(--success)]"
                    : "flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--danger)]/15 text-[var(--danger)]"
                }
              >
                {t.type === "INCOME" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{t.description || t.category?.name || "Transaction"}</span>
                <span className="text-xs text-[var(--subtle-foreground)]">
                  {formatDate(t.occurredAt)}
                  {t.category && ` · ${t.category.name}`}
                </span>
              </div>
              <span
                className={
                  t.type === "INCOME"
                    ? "shrink-0 text-sm font-semibold text-[var(--success)]"
                    : "shrink-0 text-sm font-semibold text-[var(--foreground)]"
                }
              >
                {t.type === "INCOME" ? "+" : "-"}
                {formatCurrency(t.amountCents)}
              </span>
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label="Edit"
                  onClick={() => {
                    setEditing(t);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-[var(--danger)]"
                  aria-label="Delete"
                  onClick={() => setDeleting(t)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editing}
        categories={categories}
      />
      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete transaction?"
        description={deleting ? `"${deleting.description || "This transaction"}" will be permanently removed.` : undefined}
        onConfirm={() => deleteTransactionAction(deleting!.id)}
        successMessage="Transaction deleted"
      />
    </div>
  );
}
