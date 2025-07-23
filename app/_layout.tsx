import { setupNotifications } from "@/services/NotificationService";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  useEffect(() => {
    setupNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="detail/[id]"
          options={{
            title: "Detail KGB",
            headerTintColor: "#2196F3",
            headerStyle: {
              backgroundColor: "#fff",
            },
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: "600",
            },
            headerShadowVisible: false,
            headerBackTitle: "Kembali",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
