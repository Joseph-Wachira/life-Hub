"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Flame, Star, Timer } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface DailyFocusPoint {
  date: string;
  label: string;
  minutes: number;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const minutes = payload[0]?.value ?? 0;
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 shadow-[var(--shadow-md)]">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--foreground)]">{minutes} min focused</p>
    </div>
  );
}

export function FocusAnalytics({
  sessionsToday,
  weekMinutes,
  averageRating,
  dailyMinutes,
}: {
  sessionsToday: number;
  weekMinutes: number;
  averageRating: number | null;
  dailyMinutes: DailyFocusPoint[];
}) {
  const weekHours = (weekMinutes / 60).toFixed(1);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Sessions today" value={String(sessionsToday)} icon={Timer} />
        <StatCard label="Focus time this week" value={`${weekHours} hr`} icon={Flame} />
        <StatCard
          label="Average rating"
          value={averageRating != null ? `${averageRating.toFixed(1)} / 5` : "—"}
          icon={Star}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Focused minutes — last 14 days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyMinutes} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  allowDecimals={false}
                  width={36}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-sunken)" }} />
                <Bar dataKey="minutes" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
