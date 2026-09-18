import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HelpCategory = ({
  icon,
  title,
  onPress,
}: {
  icon: string;
  title: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    className="flex-row items-center bg-dark-100/90 p-5 rounded-3xl border border-white/5 mb-3"
    onPress={onPress}
  >
    <View className="w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center mr-4">
      <Ionicons name={icon as any} size={20} color="white" />
    </View>
    <Text className="text-white font-JakartaBold text-base flex-1">
      {title}
    </Text>
    <Ionicons name="chevron-forward" size={18} color="#444" />
  </TouchableOpacity>
);

const HelpCenter = () => {
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
          Help Center
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-4">
            Common Topics
          </Text>
          <HelpCategory
            icon="car-outline"
            title="Ride Issues"
            onPress={() => {}}
          />
          <HelpCategory
            icon="wallet-outline"
            title="Payment & Refunds"
            onPress={() => {}}
          />
          <HelpCategory
            icon="person-outline"
            title="Account Settings"
            onPress={() => {}}
          />
          <HelpCategory
            icon="shield-outline"
            title="Safety Concerns"
            onPress={() => {}}
          />
        </View>

        <View className="mb-8">
          <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-4">
            Contact Us
          </Text>
          <TouchableOpacity
            className="bg-white py-5 rounded-full items-center mb-4"
            onPress={() => Linking.openURL("mailto:support@varlife.com")}
          >
            <Text className="text-black font-JakartaBold">Email Support</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-neutral-900 py-5 rounded-full items-center border border-white/5"
            onPress={() => Linking.openURL("tel:0123456789")}
          >
            <Text className="text-white font-JakartaBold">Call Hotline</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpCenter;
