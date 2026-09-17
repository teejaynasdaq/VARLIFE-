import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import SplashScreen from "@/components/SplashScreen";
import { useAuth } from "@/context/AuthContext";

const SPLASH_DURATION_MS = 2200;
const AUTH_TIMEOUT_MS = 8000;

export default function Index() {
  const { loading: authLoading, canAccessApp, isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authLoading) return;
    const timer = setTimeout(() => setAuthTimedOut(true), AUTH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [authLoading]);

  useEffect(() => {
    if (showSplash) return;
    if (authLoading && !authTimedOut) return;

    if (isAuthenticated || canAccessApp) {
      router.replace("/(root)/(tabs)/home");
    } else {
      router.replace("/(auth)/welcome");
    }
  }, [isAuthenticated, authLoading, showSplash, authTimedOut, canAccessApp]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return <View style={{ flex: 1, backgroundColor: "#000" }} />;
}
