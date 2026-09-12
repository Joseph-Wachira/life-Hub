import { View } from "react-native";
import { WifiOff, RefreshCw } from "lucide-react-native";
import { Text } from "./text";
import { useAppTheme } from "@/theme/use-app-theme";
import { useIsOnline } from "@/hooks/use-is-online";
import { usePendingMutationsCount } from "@/hooks/use-pending-mutations-count";

/** Thin banner shown app-wide (mounted once in the tabs layout) for offline / pending-sync states. Renders nothing when online with nothing queued. */
export function SyncStatusBar() {
  const theme = useAppTheme();
  const isOnline = useIsOnline();
  const pendingCount = usePendingMutationsCount();

  if (isOnline && pendingCount === 0) return null;

  const label = !isOnline
    ? pendingCount > 0
      ? `Offline — ${pendingCount} change${pendingCount === 1 ? "" : "s"} will sync when you're back online`
      : "You're offline — showing saved data"
    : `Syncing ${pendingCount} change${pendingCount === 1 ? "" : "s"}…`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: isOnline ? `${theme.colors.brand}1a` : `${theme.colors.warning}1a`,
      }}
      accessibilityLiveRegion="polite"
    >
      {isOnline ? <RefreshCw size={14} color={theme.colors.brand} /> : <WifiOff size={14} color={theme.colors.warning} />}
      <Text variant="caption" style={{ color: isOnline ? theme.colors.brand : theme.colors.warning, flex: 1 }}>
        {label}
      </Text>
    </View>
  );
}
