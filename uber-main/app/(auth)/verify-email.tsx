import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { sendEmailVerification } from "firebase/auth";
import { useCallback, useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

import CustomButton from "@/components/CustomButton";
import { auth } from "@/lib/firebase";

export default function VerifyEmail() {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Poll Firebase user status to automatically detect when they click the email verification link
  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        try {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            clearInterval(interval);
            Alert.alert("Success", "Email verified successfully!");
            router.replace("/(root)/(tabs)/home");
          }
        } catch (e) {
          console.warn("Failed to reload user in verification polling:", e);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const onCheckVerification = useCallback(async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        Alert.alert("Success", "Email verified successfully!");
        router.replace("/(root)/(tabs)/home");
      } else {
        Alert.alert(
          "Not Verified Yet",
          "Please check your inbox and tap the link to verify your email.",
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "Failed to check email verification status.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const onResend = useCallback(async () => {
    if (!auth.currentUser) return;
    setResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      Alert.alert(
        "Link Sent",
        "A new verification link has been sent to your email.",
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "Could not resend verification link.",
      );
    } finally {
      setResending(false);
    }
  }, []);

  return (
    <ScrollView className="flex-1 bg-black">
      <View className="flex-1 bg-black px-8 py-10 min-h-screen">
        <View className="flex-row items-center mt-10 mb-16">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-JakartaExtraBold tracking-[4px] absolute left-0 right-0 text-center">
            VARLIFE
          </Text>
        </View>

        <View className="mb-12 items-center">
          <Text className="text-4xl text-white font-JakartaExtraBold mb-4 text-center">
            Verify Email
          </Text>
          <Text className="text-neutral-500 text-sm font-JakartaMedium text-center leading-6 px-4">
            A verification link was sent to your email address. Please tap the
            link to activate your account.
          </Text>
        </View>

        <View className="items-center py-6 mb-8 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <ActivityIndicator size="large" color="#ffffff" className="mb-4" />
          <Text className="text-xs text-neutral-400 font-JakartaMedium">
            Waiting for verification...
          </Text>
        </View>

        <CustomButton
          title="I've Verified My Email"
          onPress={onCheckVerification}
          loading={loading}
        />

        <TouchableOpacity
          className="mt-8 items-center"
          onPress={onResend}
          disabled={resending}
        >
          <Text className="text-neutral-500 font-JakartaMedium text-sm">
            Didn't receive a link?{" "}
            <Text className="text-white font-JakartaBold">
              {resending ? "Sending..." : "Resend Link"}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
