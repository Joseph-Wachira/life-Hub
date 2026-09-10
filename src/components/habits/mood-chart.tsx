"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { MOOD_META } from "./constants";
import type { Mood } from "@prisma/client";

interface MoodPoint {
  date: string | Date;
  mood: Mood;
  energyLevel: number;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: { date: string; moodLabel: string } }[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 shadow-[var(--shadow-md)]">
      <p className="text-xs text-[var(--muted-foreground)]">{item.date}</p>
      <p className="text-sm font-semibold">{item.moodLabel}</p>
    </div>
  );
}

export function MoodChart({ history }: { history: MoodPoint[] }) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mood trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--subtle-foreground)]">Check in for a few days to see your trend.</p>
        </CardContent>
      </Card>
    );
  }

  const data = history.map((h) => ({
    date: formatDate(h.date),
    value: MOOD_META[h.mood].value,
    moodLabel: MOOD_META[h.mood].label,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis domain={[1, 5]} tickCount={5} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} width={20} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="value" stroke="var(--brand)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
