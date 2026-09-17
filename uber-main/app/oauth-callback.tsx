import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";

export default function OAuthCallback() {
  // expo-auth-session might redirect here after authentication.
  // The actual authentication is completed via WebBrowser.maybeCompleteAuthSession() globally.
  // We just need a valid route to catch the deep link so Expo Router doesn't 404,
  // and we immediately redirect the user to the home screen.
  
  useEffect(() => {
    // We replace the current screen with home to clear the auth callback from the navigation stack.
    const timer = setTimeout(() => {
      router.replace("/(root)/(tabs)/home");
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}
