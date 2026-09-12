import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { MapPin, CalendarClock } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { SkeletonList } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useEvent } from "@/features/calendar/api";
import { useAppTheme } from "@/theme/use-app-theme";
import { formatDayLabel, formatTime } from "@/lib/format/date";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const { data: event, isPending, isError, error, refetch } = useEvent(id ?? null);

  if (isPending) {
    return (
      <Screen>
        <SkeletonList rows={3} />
      </Screen>
    );
  }
  if (isError || !event) {
    return (
      <Screen>
        <ErrorState error={error} title={!event ? "Event not found" : undefined} onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: event.color, marginTop: 8 }} />
        <Text variant="title" style={{ flex: 1 }}>
          {event.title}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <CalendarClock size={16} color={theme.colors.mutedText} />
        <Text variant="body" color="muted">
          {formatDayLabel(event.start)} · {event.allDay ? "All day" : `${formatTime(event.start)} – ${formatTime(event.end)}`}
        </Text>
      </View>

      {event.location ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <MapPin size={16} color={theme.colors.mutedText} />
          <Text variant="body" color="muted">
            {event.location}
          </Text>
        </View>
      ) : null}

      {event.description ? (
        <Text variant="body" style={{ marginTop: theme.spacing.sm }}>
          {event.description}
        </Text>
      ) : null}

      {event.isRecurring ? (
        <Text variant="caption" color="subtle">
          This is a recurring event.
        </Text>
      ) : null}
    </Screen>
  );
}
