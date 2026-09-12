import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Timer, Wallet, Flame, AlertTriangle, CalendarDays, CheckCircle2 } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TaskRow } from "@/features/tasks/components/task-row";
import { useTodaySummary } from "@/features/today/api";
import { useToggleTaskDone } from "@/features/tasks/api";
import { useToggleHabit } from "@/features/habits/api";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppTheme } from "@/theme/use-app-theme";
import { formatCurrency } from "@/lib/format/currency";
import { formatTime } from "@/lib/format/date";

export default function TodayScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user, activeWorkspace } = useAuth();
  const { data, isPending, isError, error, refetch, isRefetching } = useTodaySummary();
  const toggleTask = useToggleTaskDone();
  const toggleHabit = useToggleHabit();

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const habitsDone = data?.habits.filter((h) => h.doneToday).length ?? 0;

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ gap: 2, flex: 1 }}>
          <Text variant="largeTitle">Hi, {firstName}</Text>
          <Text variant="body" color="muted">
            Here&apos;s your day at a glance.
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/workspaces")}
          accessibilityRole="button"
          accessibilityLabel={`Switch workspace, currently ${activeWorkspace?.name ?? "none"}`}
          hitSlop={8}
        >
          <Badge label={activeWorkspace?.name ?? "Workspace"} tone="brand" />
        </Pressable>
      </View>

      {isPending ? (
        <SkeletonList rows={4} rowHeight={72} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <StatTile label="Focus sessions today" value={String(data.focus.sessionsToday)} icon={Timer} />
            <StatTile
              label="Net this month"
              value={formatCurrency(data.finance.netCents)}
              icon={Wallet}
              tone={data.finance.netCents >= 0 ? "success" : "danger"}
            />
          </View>
          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <StatTile label="Habits done today" value={`${habitsDone}/${data.habits.length}`} icon={Flame} tone="warning" />
            <StatTile
              label="Overdue tasks"
              value={String(data.overdueTaskCount)}
              icon={AlertTriangle}
              tone={data.overdueTaskCount > 0 ? "danger" : "success"}
            />
          </View>

          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <CalendarDays size={16} color={theme.colors.mutedText} />
              <Text variant="subtitle">Today&apos;s schedule</Text>
            </View>
            {data.agenda.length === 0 ? (
              <EmptyState icon={CalendarDays} title="Nothing scheduled" description="Enjoy the open time." />
            ) : (
              <View style={{ gap: theme.spacing.sm }}>
                {data.agenda.map((occurrence) => (
                  <View key={occurrence.instanceId} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: occurrence.color }} />
                    <Text variant="caption" color="muted" style={{ width: 64 }}>
                      {occurrence.allDay ? "All day" : formatTime(occurrence.start)}
                    </Text>
                    <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                      {occurrence.title}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Card>
            <Text variant="subtitle">Priority tasks</Text>
            {data.priorityTasks.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="All caught up" description="No open tasks need your attention." />
            ) : (
              data.priorityTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={(done) => toggleTask.mutate({ id: task.id, done })}
                  onPress={() => router.push(`/task/${task.id}`)}
                />
              ))
            )}
          </Card>

          <Card>
            <Text variant="subtitle">Habits today</Text>
            {data.habits.length === 0 ? (
              <EmptyState icon={Flame} title="No habits yet" description="Add habits from the web app to see them here." />
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
                {data.habits.map((habit) => (
                  <Pressable
                    key={habit.id}
                    onPress={() => toggleHabit.mutate(habit.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${habit.name}, ${habit.doneToday ? "done" : "not done"} today`}
                    style={{ alignItems: "center", gap: 6, width: 64 }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: habit.doneToday ? habit.color : theme.colors.surfaceSunken,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Flame size={18} color={habit.doneToday ? "#ffffff" : theme.colors.mutedText} />
                    </View>
                    <Text variant="caption" numberOfLines={1}>
                      {habit.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}
