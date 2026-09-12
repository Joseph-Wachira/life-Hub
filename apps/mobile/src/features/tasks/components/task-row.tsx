import { Pressable, View } from "react-native";
import type { MobileTask } from "@lifehub/shared";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { useAppTheme } from "@/theme/use-app-theme";
import { priorityColors } from "@/theme/tokens";
import { formatShortDate } from "@/lib/format/date";

interface TaskRowProps {
  task: MobileTask;
  onToggle: (done: boolean) => void;
  onPress?: () => void;
}

function priorityTone(priority: MobileTask["priority"]): "danger" | "warning" | "neutral" {
  if (priority === "URGENT") return "danger";
  if (priority === "HIGH") return "warning";
  return "neutral";
}

export function TaskRow({ task, onToggle, onPress }: TaskRowProps) {
  const theme = useAppTheme();
  const done = task.status === "DONE";
  const isOverdue = !!task.dueAt && new Date(task.dueAt) < new Date() && !done;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, minHeight: 44, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Pressable
        onPress={() => onToggle(!done)}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? "Mark task as not done" : "Mark task as done"}
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: done ? theme.colors.success : priorityColors[task.priority],
          backgroundColor: done ? theme.colors.success : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {done ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} /> : null}
      </Pressable>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          variant="body"
          numberOfLines={1}
          style={done ? { textDecorationLine: "line-through", color: theme.colors.mutedText } : undefined}
        >
          {task.title}
        </Text>
        {task.dueAt ? (
          <Text variant="caption" color={isOverdue ? "danger" : "muted"}>
            {isOverdue ? "Overdue · " : "Due "}
            {formatShortDate(task.dueAt)}
          </Text>
        ) : null}
      </View>
      {!done ? <Badge label={task.priority.toLowerCase()} tone={priorityTone(task.priority)} /> : null}
    </Pressable>
  );
}
