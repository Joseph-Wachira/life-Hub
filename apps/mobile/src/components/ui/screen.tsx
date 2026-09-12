import type { ReactNode } from "react";
import { ScrollView, View, RefreshControl, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { useAppTheme } from "@/theme/use-app-theme";
import { SyncStatusBar } from "./sync-status-bar";

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: StyleProp<ViewStyle>;
  /**
   * Safe-area edges this screen applies itself. Default is left/right only,
   * because most screens sit under a Stack/Tabs header that already accounts
   * for the top inset (and, for tabs, the bottom inset) — adding "top"/
   * "bottom" here too would double that padding. Pass a fuller set (e.g.
   * `["top", "bottom", "left", "right"]`) only for screens with
   * `headerShown: false` and no tab bar, like sign-in.
   */
  edges?: Edge[];
}

/** Standard screen shell: safe-area + themed background + the global offline/sync banner + optional pull-to-refresh scroll. Every top-level screen should render inside one of these. */
export function Screen({ children, scroll = true, padded = true, onRefresh, refreshing, style, edges = ["left", "right"] }: ScreenProps) {
  const theme = useAppTheme();
  const content = (
    <View style={[{ padding: padded ? theme.spacing.lg : 0, gap: theme.spacing.lg }, !scroll && { flex: 1 }, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={edges}>
      <SyncStatusBar />
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={theme.colors.brand} /> : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
