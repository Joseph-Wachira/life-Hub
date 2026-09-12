import { useState } from "react";
import { View, Switch, Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { LogOut } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppTheme } from "@/theme/use-app-theme";
import { useRegisterPushToken } from "@/features/notifications/api";

export default function SettingsScreen() {
  const theme = useAppTheme();
  const { user, activeWorkspace, signOut } = useAuth();
  const registerPushToken = useRegisterPushToken();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushNote, setPushNote] = useState<string | null>(null);

  async function handleTogglePush(value: boolean) {
    if (!value) {
      setPushEnabled(false);
      return;
    }
    setPushBusy(true);
    setPushNote(null);
    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const existing = await Notifications.getPermissionsAsync();
      let status = existing.status;
      if (status !== "granted") {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }
      if (status !== "granted") {
        setPushNote("Notification permission was denied in system settings.");
        setPushEnabled(false);
        return;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
      if (!projectId) {
        setPushNote("Push notifications need an EAS project configured first — see the mobile app README.");
        setPushEnabled(false);
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      await registerPushToken.mutateAsync({
        token: token.data,
        platform: Platform.OS === "ios" ? "ios" : "android",
        deviceName: Device.deviceName ?? undefined,
      });
      setPushEnabled(true);
    } catch (error) {
      setPushNote(error instanceof Error ? error.message : "Couldn't enable push notifications.");
      setPushEnabled(false);
    } finally {
      setPushBusy(false);
    }
  }

  function handleSignOut() {
    Alert.alert("Sign out", "You'll need to sign in again to access your data.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void signOut() },
    ]);
  }

  return (
    <Screen>
      <Card>
        <Text variant="label" color="muted">
          Account
        </Text>
        <Text variant="bodyStrong">{user?.name}</Text>
        <Text variant="body" color="muted">
          {user?.email}
        </Text>
      </Card>

      <Card>
        <Text variant="label" color="muted">
          Workspace
        </Text>
        <Text variant="bodyStrong">{activeWorkspace?.name ?? "None selected"}</Text>
      </Card>

      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: theme.spacing.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="body">Push notifications</Text>
            <Text variant="caption" color="muted">
              Best-effort — registered here, but delivery hasn&apos;t been verified against a real device. See the mobile README.
            </Text>
          </View>
          <Switch value={pushEnabled} onValueChange={handleTogglePush} disabled={pushBusy} trackColor={{ true: theme.colors.brand }} />
        </View>
        {pushNote ? (
          <Text variant="caption" color="warning">
            {pushNote}
          </Text>
        ) : null}
      </Card>

      <Button label="Sign out" variant="danger" onPress={handleSignOut} icon={<LogOut size={16} color="#ffffff" />} fullWidth />
    </Screen>
  );
}
