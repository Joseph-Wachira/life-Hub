import { useEffect } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { focusManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, PERSIST_OPTIONS } from "@/lib/api/query-client";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import "@/lib/notifications/handler";

SplashScreen.preventAutoHideAsync();

function useRefetchOnForeground() {
  useEffect(() => {
    function onAppStateChange(status: AppStateStatus) {
      if (Platform.OS !== "web") focusManager.setFocused(status === "active");
    }
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, []);
}

function RootNavigator() {
  const { status } = useAuth();

  // The splash screen stays up through "loading", so it's fine that the
  // Stack below briefly settles on a guard before status resolves — nobody
  // sees it happen.
  useEffect(() => {
    if (status !== "loading") SplashScreen.hideAsync();
  }, [status]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === "signedIn"}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status !== "signedIn"}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  useRefetchOnForeground();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={PERSIST_OPTIONS}
          onSuccess={() => {
            void queryClient.resumePausedMutations();
          }}
        >
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
