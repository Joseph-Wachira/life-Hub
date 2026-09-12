import { Stack } from "expo-router";
import { useAppTheme } from "@/theme/use-app-theme";

export default function AppLayout() {
  const theme = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="task/[id]" options={{ title: "Task" }} />
      <Stack.Screen name="event/[id]" options={{ title: "Event" }} />
      <Stack.Screen name="note/[id]" options={{ title: "Note" }} />
      <Stack.Screen name="habits" options={{ title: "Habits" }} />
      <Stack.Screen name="notes" options={{ title: "Notes" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="workspaces" options={{ title: "Switch workspace", presentation: "modal" }} />
      <Stack.Screen name="modals/create-task" options={{ title: "New Task", presentation: "modal" }} />
      <Stack.Screen name="modals/create-event" options={{ title: "New Event", presentation: "modal" }} />
      <Stack.Screen name="modals/create-note" options={{ title: "New Note", presentation: "modal" }} />
      <Stack.Screen name="modals/add-transaction" options={{ title: "Add Transaction", presentation: "modal" }} />
    </Stack>
  );
}
