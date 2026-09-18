import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/context/AuthContext";

export default function RootLayout() {
  const { canAccessApp, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!canAccessApp) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#000" },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="student-experience" />
      <Stack.Screen name="student-verification" />
      <Stack.Screen name="saved-locations" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="security" />
      <Stack.Screen name="help" />
      <Stack.Screen name="legal" />
      <Stack.Screen name="lost-item" />
      <Stack.Screen name="courier" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="confirm-ride" />
    </Stack>
  );
}
