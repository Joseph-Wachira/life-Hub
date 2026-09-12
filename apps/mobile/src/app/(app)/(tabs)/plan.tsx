import { useMemo, useState } from "react";
import { View, FlatList, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Plus, ChevronLeft, ChevronRight, ListChecks, CalendarDays } from "lucide-react-native";
import type { TaskStatus } from "@lifehub/shared";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TextField } from "@/components/ui/text-field";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { TaskRow } from "@/features/tasks/components/task-row";
import { useTasks, useToggleTaskDone } from "@/features/tasks/api";
import { useEvents } from "@/features/calendar/api";
import { useAppTheme } from "@/theme/use-app-theme";
import { formatDayLabel, formatTime } from "@/lib/format/date";

type PlanView = "tasks" | "calendar";
type TaskFilter = "active" | "done" | "all";

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function endOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}
function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export default function PlanScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [view, setView] = useState<PlanView>("tasks");

  return (
    <Screen scroll={false} padded={false}>
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="largeTitle">Plan</Text>
          <Pressable
            onPress={() => router.push(view === "tasks" ? "/modals/create-task" : "/modals/create-event")}
            accessibilityRole="button"
            accessibilityLabel={view === "tasks" ? "New task" : "New event"}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.brand,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={20} color={theme.colors.onBrand} />
          </Pressable>
        </View>
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            { value: "tasks", label: "Tasks" },
            { value: "calendar", label: "Calendar" },
          ]}
        />
      </View>
      {view === "tasks" ? <TasksView /> : <CalendarDayView />}
    </Screen>
  );
}

function TasksView() {
  const theme = useAppTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<TaskFilter>("active");
  const [search, setSearch] = useState("");
  const toggleTask = useToggleTaskDone();
  const { data, isPending, isError, error, refetch, isRefetching } = useTasks({
    status: filter === "done" ? ("DONE" as TaskStatus) : undefined,
    search: search || undefined,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return filter === "active" ? data.filter((task) => task.status !== "DONE") : data;
  }, [data, filter]);

  return (
    <FlatList
      style={{ flex: 1, paddingHorizontal: theme.spacing.lg }}
      data={filtered}
      keyExtractor={(task) => task.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListHeaderComponent={
        <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.md }}>
          <TextField placeholder="Search tasks" value={search} onChangeText={setSearch} />
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={[
              { value: "active", label: "Active" },
              { value: "done", label: "Done" },
              { value: "all", label: "All" },
            ]}
          />
        </View>
      }
      renderItem={({ item }) => (
        <TaskRow
          task={item}
          onToggle={(done) => toggleTask.mutate({ id: item.id, done })}
          onPress={() => router.push(`/task/${item.id}`)}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.colors.border }} />}
      ListEmptyComponent={
        isPending ? (
          <SkeletonList rows={5} />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <EmptyState icon={ListChecks} title="No tasks" description="Create your first task to get started." />
        )
      }
      contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.spacing.xl }}
    />
  );
}

function CalendarDayView() {
  const theme = useAppTheme();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const { data, isPending, isError, error, refetch } = useEvents(startOfDay(selectedDate), endOfDay(selectedDate));

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg, flexGrow: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable onPress={() => setSelectedDate((d) => addDays(d, -1))} hitSlop={8} accessibilityLabel="Previous day">
          <ChevronLeft size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="subtitle">{formatDayLabel(selectedDate.toISOString())}</Text>
        <Pressable onPress={() => setSelectedDate((d) => addDays(d, 1))} hitSlop={8} accessibilityLabel="Next day">
          <ChevronRight size={22} color={theme.colors.text} />
        </Pressable>
      </View>

      {isPending ? (
        <SkeletonList rows={3} rowHeight={64} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events" description="Nothing scheduled for this day." />
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {data.map((occurrence) => (
            <Pressable key={occurrence.instanceId} onPress={() => router.push(`/event/${occurrence.eventId}`)}>
              <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 4, height: 36, borderRadius: 2, backgroundColor: occurrence.color }} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {occurrence.title}
                  </Text>
                  <Text variant="caption" color="muted">
                    {occurrence.allDay ? "All day" : `${formatTime(occurrence.start)} – ${formatTime(occurrence.end)}`}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
