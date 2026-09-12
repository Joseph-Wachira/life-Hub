import { View } from "react-native";
import { AlertTriangle, WifiOff } from "lucide-react-native";
import { Text } from "./text";
import { Button } from "./button";
import { useAppTheme } from "@/theme/use-app-theme";
import { NetworkError } from "@/lib/api/client";

interface ErrorStateProps {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
}

export function ErrorState({ error, title, onRetry }: ErrorStateProps) {
  const theme = useAppTheme();
  const isOffline = error instanceof NetworkError;
  const message = title ?? (isOffline ? "You're offline" : "Something went wrong");
  const description = isOffline
    ? "Check your connection and try again. Anything you've already loaded is still available."
    : error instanceof Error
      ? error.message
      : "Please try again.";

  return (
    <View style={{ alignItems: "center", justifyContent: "center", gap: theme.spacing.sm, paddingVertical: theme.spacing.xl }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.surfaceSunken,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isOffline ? (
          <WifiOff size={22} color={theme.colors.mutedText} />
        ) : (
          <AlertTriangle size={22} color={theme.colors.danger} />
        )}
      </View>
      <Text variant="subtitle" style={{ textAlign: "center" }}>
        {message}
      </Text>
      <Text variant="body" color="muted" style={{ textAlign: "center", maxWidth: 280 }}>
        {description}
      </Text>
      {onRetry ? (
        <View style={{ marginTop: theme.spacing.sm }}>
          <Button label="Try again" onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}
