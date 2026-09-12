import { useEffect, useState } from "react";
import { View, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import type { TaskPriority, TaskStatus } from "@lifehub/shared";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Card } from "@/components/ui/card";
import { SkeletonList } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useTask, useUpdateTask, useDeleteTask } from "@/features/tasks/api";
import { useAppTheme } from "@/theme/use-app-theme";

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const router = useRouter();
  const { data: task, isPending, isError, error, refetch } = useTask(id ?? null);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [status, setStatus] = useState<TaskStatus>("TODO");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(task.priority);
      setStatus(task.status);
    }
  }, [task]);

  if (isPending) {
    return (
      <Screen>
        <SkeletonList rows={4} />
      </Screen>
    );
  }
  if (isError || !task) {
    return (
      <Screen>
        <ErrorState error={error} title={!task ? "Task not found" : undefined} onRetry={refetch} />
      </Screen>
    );
  }

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed || !task) return;
    updateTask.mutate({ id: task.id, patch: { title: trimmed, priority, status } });
  }

  function handleDelete() {
    if (!task) return;
    Alert.alert("Delete task", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteTask.mutate(task.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <TextField label="Title" value={title} onChangeText={setTitle} />

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="muted">
          Status
        </Text>
        <SegmentedControl
          value={status}
          onChange={setStatus}
          options={[
            { value: "TODO", label: "To do" },
            { value: "IN_PROGRESS", label: "In progress" },
            { value: "DONE", label: "Done" },
          ]}
        />
      </View>

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

      {task.project ? (
        <Card>
          <Text variant="caption" color="muted">
            Project
          </Text>
          <Text variant="body">{task.project.name}</Text>
        </Card>
      ) : null}

      <Button label="Save changes" onPress={handleSave} loading={updateTask.isPending} fullWidth />
      <Button label="Delete task" onPress={handleDelete} variant="danger" fullWidth icon={<Trash2 size={16} color="#ffffff" />} />
    </Screen>
  );
}
