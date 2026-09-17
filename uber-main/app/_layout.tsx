import "react-native-reanimated";
import { Stack } from "expo-router";
import { useEffect } from "react";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { registerForPushNotifications } from "@/lib/notifications";

function PushRegistration() {
  const { user, isAuthenticated } = useAuth();
  useEffect(() => {
    if (isAuthenticated && user?.clerk_id) {
      registerForPushNotifications(user.clerk_id);
    }
  }, [isAuthenticated, user?.clerk_id]);
  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PushRegistration />
      <Stack>
        <Stack.Screen name="(root)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(driver)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
