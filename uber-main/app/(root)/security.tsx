import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SecurityItem = ({
  icon,
  title,
  subtitle,
  rightElement,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    className="flex-row items-center justify-between py-5 border-b border-neutral-900"
    onPress={onPress}
    disabled={!onPress}
  >
    <View className="flex-row items-center flex-1">
      <View className="w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center mr-4">
        <Ionicons name={icon as any} size={20} color="white" />
      </View>
      <View className="flex-1 pr-4">
        <Text className="text-white font-JakartaBold text-base">{title}</Text>
        {subtitle && (
          <Text className="text-neutral-500 text-xs font-JakartaMedium mt-1">
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    {rightElement
      ? rightElement
      : onPress && <Ionicons name="chevron-forward" size={18} color="#444" />}
  </TouchableOpacity>
);

const SecurityScreen = () => {
  const [twoFactor, setTwoFactor] = useState(false);
  const [biometrics, setBiometrics] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-5 pt-2 flex-row items-center mb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-JakartaExtraBold">
          Security & Privacy
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-4">
            Security Access
          </Text>
          <View className="bg-dark-100/90 px-5 rounded-[32px] border border-white/5">
            <SecurityItem
              icon="finger-print-outline"
              title="Biometric Login"
              subtitle="Use FaceID or Fingerprint"
              rightElement={
                <Switch
                  value={biometrics}
                  onValueChange={setBiometrics}
                  trackColor={{ false: "#333", true: "#1C6EF2" }}
                  thumbColor="#fff"
                />
              }
            />
            <SecurityItem
              icon="shield-checkmark-outline"
              title="Two-Factor Authentication"
              subtitle="Secure your account with 2FA"
              rightElement={
                <Switch
                  value={twoFactor}
                  onValueChange={setTwoFactor}
                  trackColor={{ false: "#333", true: "#1C6EF2" }}
                  thumbColor="#fff"
                />
              }
            />
            <SecurityItem
              icon="key-outline"
              title="Change Password"
              onPress={() => {
                Alert.alert(
                  "Feature Coming Soon",
                  "Password reset flow will be available in the next update.",
                );
              }}
            />
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-4">
            Privacy Settings
          </Text>
          <View className="bg-dark-100/90 px-5 rounded-[32px] border border-white/5">
            <SecurityItem
              icon="eye-off-outline"
              title="Stealth Mode"
              subtitle="Hide profile from other users"
              onPress={() => {}}
            />
            <SecurityItem
              icon="share-social-outline"
              title="Data Sharing"
              subtitle="Manage how your data is used"
              onPress={() => {}}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SecurityScreen;
