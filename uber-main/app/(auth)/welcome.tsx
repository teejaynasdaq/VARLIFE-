import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import { useAuth } from "@/context/AuthContext";

export default function Welcome() {
  const { enterGuestMode } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleSkip = async () => {
    await enterGuestMode();
    router.replace("/(root)/(tabs)/home");
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        className="flex-1 justify-between px-8 py-12"
      >
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-5xl font-JakartaExtraBold tracking-[6px] mb-3">
            VARLIFE
          </Text>
          <View className="w-10 h-[1px] bg-neutral-700 mb-4" />
          <Text className="text-neutral-500 text-sm font-JakartaMedium tracking-[3px] uppercase">
            Student rides done right.
          </Text>
        </View>

        <View className="gap-4 mb-2">
          <CustomButton
            title="Sign In"
            onPress={() => router.push("/(auth)/sign-in")}
            bgVariant="primary"
            textVariant="default"
          />
          <CustomButton
            title="Create Account"
            onPress={() => router.push("/(auth)/sign-up")}
            bgVariant="outline"
            textVariant="secondary"
          />
        </View>

        <TouchableOpacity onPress={handleSkip} className="py-4 mb-4">
          <Text className="text-neutral-500 text-center text-sm font-JakartaMedium">
            Skip for now
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}
