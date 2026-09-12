import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import type { TaskPriority } from "@lifehub/shared";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useCreateTask } from "@/features/tasks/api";
import { useAppTheme } from "@/theme/use-app-theme";
import { fireCreateMutation } from "@/lib/forms/fire-create-mutation";

type DueOption = "none" | "today" | "tomorrow" | "nextWeek";

function resolveDueDate(option: DueOption): Date | undefined {
  if (option === "none") return undefined;
  const date = new Date();
  date.setHours(23, 59, 0, 0);
  if (option === "tomorrow") date.setDate(date.getDate() + 1);
  if (option === "nextWeek") date.setDate(date.getDate() + 7);
  return date;
}

export default function CreateTaskModal() {
  const theme = useAppTheme();
  const router = useRouter();
  const createTask = useCreateTask();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [due, setDue] = useState<DueOption>("none");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Give the task a title.");
      return;
    }
    setError(null);
    fireCreateMutation({
      mutateAsync: () => createTask.mutateAsync({ title: trimmed, priority, status: "TODO", dueAt: resolveDueDate(due) }),
      onNavigateAway: () => router.back(),
      onError: setError,
    });
  }

  return (
    <Screen edges={["bottom", "left", "right"]}>
      <TextField label="Title" value={title} onChangeText={setTitle} autoFocus placeholder="What needs doing?" />

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="muted">
          Priority
        </Text>
        <SegmentedControl
          value={priority}
          onChange={setPriority}
          options={[
            { value: "LOW", label: "Low" },
            { value: "MEDIUM", label: "Medium" },
            { value: "HIGH", label: "High" },
            { value: "URGENT", label: "Urgent" },
          ]}
        />
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="muted">
          Due
        </Text>
        <SegmentedControl
          value={due}
          onChange={setDue}
          options={[
            { value: "none", label: "None" },
            { value: "today", label: "Today" },
            { value: "tomorrow", label: "Tomorrow" },
            { value: "nextWeek", label: "Next week" },
          ]}
        />
      </View>

      {error ? (
        <Text color="danger" variant="caption">
          {error}
        </Text>
      ) : null}

      <Button label="Create task" onPress={handleSubmit} loading={createTask.isPending} fullWidth size="lg" />
    </Screen>
  );
}
