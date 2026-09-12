import { Pressable, View } from "react-native";
import { Flame } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useHabits, useToggleHabit } from "@/features/habits/api";
import { useAppTheme } from "@/theme/use-app-theme";

export default function HabitsScreen() {
  const theme = useAppTheme();
  const { data, isPending, isError, error, refetch, isRefetching } = useHabits();
  const toggleHabit = useToggleHabit();

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      {isPending ? (
        <SkeletonList rows={4} rowHeight={72} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Flame} title="No habits yet" description="Add habits from the web app to track them here." />
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          {data.map((habit) => (
            <Card key={habit.id} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Pressable
                onPress={() => toggleHabit.mutate(habit.id)}
                accessibilityRole="button"
                accessibilityLabel={`${habit.name}, ${habit.todayCompletedCount} of ${habit.targetPerDay} today`}
                hitSlop={4}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: habit.doneToday ? habit.color : theme.colors.surfaceSunken,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Flame size={20} color={habit.doneToday ? "#ffffff" : theme.colors.mutedText} />
              </Pressable>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{habit.name}</Text>
                <Text variant="caption" color="muted">
                  {habit.todayCompletedCount}/{habit.targetPerDay} today · {habit.streak.current} day streak
                  {habit.streak.longest > habit.streak.current ? ` (best ${habit.streak.longest})` : ""}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
