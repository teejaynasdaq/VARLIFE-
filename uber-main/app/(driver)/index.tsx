import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { canDriverGoOnline } from "@/lib/veriff";

/**
 * Driver entry point — routes based on registration and verification status.
 */
export default function DriverIndex() {
  const { user } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      router.replace("/(auth)/welcome");
      return;
    }
    // Removed supabaseWithAuth check

    const checkDriverProfile = async () => {
      try {
        const { data } = await supabase
          .from("drivers")
          .select("id, is_verified, verification_status, veriff_session_id")
          .eq("id", user.id)
          .maybeSingle();

        const driver = data as {
          id: string;
          is_verified: boolean;
          verification_status: string;
          veriff_session_id: string | null;
        } | null;

        if (!driver) {
          router.replace("/(driver)/driver-register");
        } else if (canDriverGoOnline(driver as any)) {
          router.replace("/(driver)/driver-home");
        } else {
          router.replace("/(driver)/driver-verification" as Href);
        }
      } catch (err) {
        console.error("[Driver Index] Error checking driver profile:", err);
        router.replace("/(driver)/driver-register");
      } finally {
        setChecking(false);
      }
    };

    checkDriverProfile();
  }, [user, router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
      }}
    >
      <ActivityIndicator size="large" color="white" />
      <Text
        style={{
          color: "#555",
          marginTop: 16,
          fontSize: 13,
          fontWeight: "600",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        Loading Driver Mode
      </Text>
    </View>
  );
}
