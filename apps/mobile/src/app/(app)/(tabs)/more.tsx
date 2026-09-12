import { useRouter } from "expo-router";
import { Flame, NotebookText, Bell, Layers, Settings as SettingsIcon } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { ListRow } from "@/components/ui/list-row";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/features/notifications/api";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppTheme } from "@/theme/use-app-theme";

export default function MoreScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user, activeWorkspace } = useAuth();
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <Screen>
      <Text variant="largeTitle">More</Text>

      <Card style={{ gap: 0 }}>
        <ListRow
          title="Habits"
          subtitle="Today's habits & streaks"
          leading={<Flame size={20} color={theme.colors.mutedText} />}
          onPress={() => router.push("/habits")}
          showChevron
        />
        <ListRow
          title="Notes"
          subtitle="Search & quick notes"
          leading={<NotebookText size={20} color={theme.colors.mutedText} />}
          onPress={() => router.push("/notes")}
          showChevron
        />
        <ListRow
          title="Notifications"
          subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          leading={<Bell size={20} color={theme.colors.mutedText} />}
          trailing={unreadCount > 0 ? <Badge label={String(unreadCount)} tone="danger" /> : undefined}
          onPress={() => router.push("/notifications")}
          showChevron
        />
        <ListRow
          title="Workspace"
          subtitle={activeWorkspace?.name ?? "None selected"}
          leading={<Layers size={20} color={theme.colors.mutedText} />}
          onPress={() => router.push("/workspaces")}
          showChevron
        />
      </Card>

      <Card style={{ gap: 0 }}>
        <ListRow
          title="Settings"
          subtitle={user?.email}
          leading={<SettingsIcon size={20} color={theme.colors.mutedText} />}
          onPress={() => router.push("/settings")}
          showChevron
        />
      </Card>
    </Screen>
  );
}
