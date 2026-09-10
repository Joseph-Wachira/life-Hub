"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { CategorySpend } from "@/lib/services/finance";

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: CategorySpend }[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 shadow-[var(--shadow-md)]">
      <p className="text-xs text-[var(--muted-foreground)]">{item.name}</p>
      <p className="text-sm font-semibold">{formatCurrency(item.amountCents)}</p>
    </div>
  );
}

export function SpendingChart({ data }: { data: CategorySpend[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-[var(--subtle-foreground)]">
        No expenses logged this month yet.
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.amountCents, 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="h-48 w-full sm:h-56 sm:w-56 sm:shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="amountCents" nameKey="name" innerRadius="60%" outerRadius="90%" paddingAngle={2}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="var(--surface)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {data.slice(0, 6).map((d) => (
          <div key={d.categoryId ?? "uncategorized"} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="min-w-0 flex-1 truncate">{d.name}</span>
            <span className="shrink-0 font-medium">{formatCurrency(d.amountCents)}</span>
            <span className="w-10 shrink-0 text-right text-xs text-[var(--subtle-foreground)]">
              {total > 0 ? Math.round((d.amountCents / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
