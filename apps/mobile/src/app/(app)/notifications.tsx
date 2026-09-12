import { View, Pressable } from "react-native";
import { Bell, CheckCheck } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/features/notifications/api";
import { useAppTheme } from "@/theme/use-app-theme";
import { formatDayLabel } from "@/lib/format/date";

export default function NotificationsScreen() {
  const theme = useAppTheme();
  const { data, isPending, isError, error, refetch, isRefetching } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = data?.filter((n) => !n.isRead).length ?? 0;

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      {unreadCount > 0 ? (
        <Button
          label={`Mark all ${unreadCount} as read`}
          variant="secondary"
          onPress={() => markAllRead.mutate()}
          loading={markAllRead.isPending}
          icon={<CheckCheck size={16} color={theme.colors.text} />}
        />
      ) : null}

      {isPending ? (
        <SkeletonList rows={5} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {data.map((notification) => (
            <Pressable key={notification.id} onPress={() => !notification.isRead && markRead.mutate(notification.id)}>
              <Card
                style={{
                  flexDirection: "row",
                  gap: 10,
                  backgroundColor: notification.isRead ? theme.colors.surface : `${theme.colors.brand}0d`,
                }}
              >
                {!notification.isRead ? (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.brand, marginTop: 6 }} />
                ) : (
                  <View style={{ width: 8 }} />
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{notification.title}</Text>
                  {notification.body ? (
                    <Text variant="caption" color="muted">
                      {notification.body}
                    </Text>
                  ) : null}
                  <Text variant="caption" color="subtle">
                    {formatDayLabel(notification.scheduledFor)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
