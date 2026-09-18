import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { registerForPushNotifications } from "@/lib/notifications";
import { deleteUserAccount } from "@/lib/supabase";

const SettingRow = ({
  icon,
  title,
  subtitle,
  rightElement,
  onPress,
  danger,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) => (
  <TouchableOpacity
    className="flex-row items-center justify-between py-4 border-b border-neutral-900"
    onPress={onPress}
    disabled={!onPress}
  >
    <View className="flex-row items-center flex-1">
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${danger ? "bg-red-500/10" : "bg-neutral-900"}`}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={danger ? "#FF3B30" : "white"}
        />
      </View>
      <View className="flex-1 pr-4">
        <Text
          className={`font-JakartaBold text-base ${danger ? "text-[#FF3B30]" : "text-white"}`}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-neutral-500 text-xs font-JakartaMedium mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
    {rightElement ??
      (onPress ? (
        <Ionicons name="chevron-forward" size={18} color="#555" />
      ) : null)}
  </TouchableOpacity>
);

export default function Settings() {
  const { user, signOut, deleteAccount } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This permanently deletes your VARLIFE account and anonymizes your data. Active rides will be cancelled. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            if (!user?.id || deleting) return;
            setDeleting(true);
            try {
              await deleteUserAccount(user.id, user.clerk_id ?? user.id);
              await deleteAccount();
              await signOut();
              router.replace("/(auth)/welcome");
              Alert.alert(
                "Account Deleted",
                "Your account has been permanently deleted.",
              );
            } catch (err: any) {
              Alert.alert(
                "Deletion Failed",
                err.message ??
                  "Could not delete account. Contact support@varlife.com",
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const toggleNotifications = async (enabled: boolean) => {
    setNotifications(enabled);
    if (enabled && user?.clerk_id) {
      await registerForPushNotifications(user.clerk_id);
    }
  };

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
        <Text className="text-white text-xl font-JakartaExtraBold tracking-wide">
          Settings
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-2">
            Account
          </Text>
          <View className="bg-dark-100/90 p-2 px-4 rounded-3xl border border-white/5">
            <SettingRow
              icon="person-outline"
              title="Edit Profile"
              onPress={() => router.push("/(root)/(tabs)/profile")}
            />
            <SettingRow
              icon="lock-closed-outline"
              title="Change Password"
              onPress={() => router.push("/(root)/security" as any)}
            />
            <SettingRow
              icon="trash-outline"
              title="Delete Account"
              subtitle="Permanently remove your data"
              danger
              onPress={handleDeleteAccount}
            />
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-2">
            Preferences
          </Text>
          <View className="bg-dark-100/90 p-2 px-4 rounded-3xl border border-white/5">
            <SettingRow
              icon="notifications-outline"
              title="Push Notifications"
              subtitle="Ride updates and promos"
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: "#333", true: "#1C6EF2" }}
                  thumbColor="#fff"
                />
              }
            />
            <SettingRow
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Premium dark theme"
              rightElement={
                <Switch
                  value={isDarkMode}
                  onValueChange={setIsDarkMode}
                  trackColor={{ false: "#333", true: "#1C6EF2" }}
                  thumbColor="#fff"
                />
              }
            />
            <SettingRow
              icon="location-outline"
              title="Live Location Sharing"
              subtitle="Share active trips automatically"
              rightElement={
                <Switch
                  value={locationSharing}
                  onValueChange={setLocationSharing}
                  trackColor={{ false: "#333", true: "#1C6EF2" }}
                  thumbColor="#fff"
                />
              }
            />
          </View>
        </View>

        <View className="mb-10">
          <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-2">
            About
          </Text>
          <View className="bg-dark-100/90 p-2 px-4 rounded-3xl border border-white/5">
            <SettingRow
              icon="document-text-outline"
              title="Terms of Service"
              onPress={() => router.push("/(root)/legal")}
            />
            <SettingRow
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              onPress={() => router.push("/(root)/legal")}
            />
            <SettingRow
              icon="log-out-outline"
              title="Log Out"
              danger
              onPress={handleLogout}
            />
            <SettingRow
              icon="information-circle-outline"
              title="App Version"
              rightElement={
                <Text className="text-neutral-500 font-JakartaBold">
                  v2.4.1
                </Text>
              }
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
