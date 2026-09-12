import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppTheme } from "@/theme/use-app-theme";
import { WORKSPACE_TYPE_META } from "@/features/workspaces/workspace-meta";

export default function WorkspacesScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId } = useAuth();

  return (
    <Screen edges={["bottom", "left", "right"]}>
      <Text variant="largeTitle">Switch workspace</Text>
      <View style={{ gap: theme.spacing.sm }}>
        {workspaces.map((workspace) => {
          const meta = WORKSPACE_TYPE_META[workspace.type];
          const Icon = meta.icon;
          const selected = workspace.id === activeWorkspaceId;
          return (
            <Pressable
              key={workspace.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={async () => {
                await setActiveWorkspaceId(workspace.id);
                router.back();
              }}
            >
              <Card style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${workspace.color}22`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={20} color={workspace.color} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{workspace.name}</Text>
                  <Text variant="caption" color="muted">
                    {meta.label}
                  </Text>
                </View>
                {selected ? <Check size={20} color={theme.colors.brand} /> : null}
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
