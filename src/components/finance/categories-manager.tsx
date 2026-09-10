"use client";

import { useState } from "react";
import { MoreHorizontal, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryFormDialog, type CategoryOption } from "./category-form-dialog";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { deleteCategoryAction } from "@/lib/actions/finance";

function CategoryGroup({
  title,
  categories,
  onEdit,
  onDelete,
}: {
  title: string;
  categories: CategoryOption[];
  onEdit: (category: CategoryOption) => void;
  onDelete: (category: CategoryOption) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="py-4 text-sm text-[var(--muted-foreground)]">No {title.toLowerCase()} categories yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--border)]">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium">
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                  <span className="truncate">{category.name}</span>
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 shrink-0">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Category actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(category)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => onDelete(category)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function CategoriesManager({ categories }: { categories: CategoryOption[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryOption | null>(null);
  const [deleting, setDeleting] = useState<CategoryOption | null>(null);
  const [defaultType, setDefaultType] = useState<"INCOME" | "EXPENSE">("EXPENSE");

  const income = categories.filter((c) => c.type === "INCOME");
  const expense = categories.filter((c) => c.type === "EXPENSE");

  function openCreate(type: "INCOME" | "EXPENSE") {
    setEditing(null);
    setDefaultType(type);
    setFormOpen(true);
  }

  function openEdit(category: CategoryOption) {
    setEditing(category);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => openCreate("EXPENSE")}>
          <Plus className="size-4" />
          New expense category
        </Button>
        <Button variant="secondary" onClick={() => openCreate("INCOME")}>
          <Plus className="size-4" />
          New income category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories yet"
          description="Create your first category so transactions, budgets, and bills have somewhere to go."
          action={
            <Button onClick={() => openCreate("EXPENSE")}>
              <Plus className="size-4" />
              New category
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <CategoryGroup title="Expense" categories={expense} onEdit={openEdit} onDelete={setDeleting} />
          <CategoryGroup title="Income" categories={income} onEdit={openEdit} onDelete={setDeleting} />
        </div>
      )}

      <CategoryFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        defaultType={defaultType}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        description="Transactions and bills using this category will keep their history but lose the category tag. Any budget for it will also be removed."
        onConfirm={() => deleteCategoryAction(deleting!.id)}
        successMessage="Category deleted."
      />
    </div>
  );
}
