import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/session";
import { listCategories } from "@/lib/services/finance";
import { CategoriesManager } from "@/components/finance/categories-manager";

export const metadata: Metadata = { title: "Categories · Finance" };

export default async function FinanceCategoriesPage() {
  const { workspace } = await requireWorkspace();
  const categories = await listCategories(workspace.id);
  return <CategoriesManager categories={categories} />;
}
