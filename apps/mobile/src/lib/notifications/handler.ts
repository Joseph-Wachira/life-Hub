import * as Notifications from "expo-notifications";

// Side-effect only: configures how a push notification behaves while the
// app is in the foreground. Imported once from the root layout.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
