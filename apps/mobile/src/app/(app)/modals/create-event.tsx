import { useState } from "react";
import { View, Switch } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useCreateEvent } from "@/features/calendar/api";
import { useAppTheme } from "@/theme/use-app-theme";
import { brand } from "@/theme/tokens";
import { fireCreateMutation } from "@/lib/forms/fire-create-mutation";

type DayOption = "today" | "tomorrow";

function parseTime(base: Date, value: string): Date | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(base);
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
}

export default function CreateEventModal() {
  const theme = useAppTheme();
  const router = useRouter();
  const createEvent = useCreateEvent();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [day, setDay] = useState<DayOption>("today");
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Give the event a title.");
      return;
    }

    const base = new Date();
    if (day === "tomorrow") base.setDate(base.getDate() + 1);

    let startAt: Date;
    let endAt: Date;
    if (allDay) {
      startAt = new Date(base);
      startAt.setHours(0, 0, 0, 0);
      endAt = new Date(base);
      endAt.setHours(23, 59, 59, 0);
    } else {
      const start = parseTime(base, startTime);
      const end = parseTime(base, endTime);
      if (!start || !end) {
        setError("Enter times as HH:MM, e.g. 14:30.");
        return;
      }
      if (end <= start) {
        setError("End time must be after start time.");
        return;
      }
      startAt = start;
      endAt = end;
    }

    setError(null);
    fireCreateMutation({
      mutateAsync: () =>
        createEvent.mutateAsync({
          title: trimmed,
          location: location.trim() || undefined,
          startAt,
          endAt,
          allDay,
          color: brand.indigo,
        }),
      onNavigateAway: () => router.back(),
      onError: setError,
    });
  }

  return (
    <Screen edges={["bottom", "left", "right"]}>
      <TextField label="Title" value={title} onChangeText={setTitle} autoFocus placeholder="Event title" />
      <TextField label="Location (optional)" value={location} onChangeText={setLocation} placeholder="Where?" />

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="muted">
          Day
        </Text>
        <SegmentedControl
          value={day}
          onChange={setDay}
          options={[
            { value: "today", label: "Today" },
            { value: "tomorrow", label: "Tomorrow" },
          ]}
        />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="body">All day</Text>
        <Switch value={allDay} onValueChange={setAllDay} trackColor={{ true: theme.colors.brand }} />
      </View>

      {!allDay ? (
        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <TextField label="Start" value={startTime} onChangeText={setStartTime} placeholder="09:00" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="End" value={endTime} onChangeText={setEndTime} placeholder="10:00" />
          </View>
        </View>
      ) : null}

      {error ? (
        <Text color="danger" variant="caption">
          {error}
        </Text>
      ) : null}

      <Button label="Create event" onPress={handleSubmit} loading={createEvent.isPending} fullWidth size="lg" />
    </Screen>
  );
}
