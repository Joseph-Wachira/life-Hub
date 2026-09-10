import { PageHeader } from "@/components/layout/page-header";
import { FinanceSubnav } from "@/components/finance/finance-subnav";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <PageHeader title="Finance" description="Income, expenses, budgets, bills, and savings — all in cents-perfect detail." />
      <FinanceSubnav />
      <div className="flex flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
