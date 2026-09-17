import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LegalItem = ({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    className="flex-row items-center justify-between py-5 border-b border-neutral-900"
    onPress={onPress}
  >
    <Text className="text-white font-JakartaMedium text-base">{title}</Text>
    <Ionicons name="chevron-forward" size={18} color="#444" />
  </TouchableOpacity>
);

const LegalPrivacy = () => {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-5 pt-2 flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-JakartaExtraBold">
          Legal & Privacy
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="bg-dark-100/90 px-5 rounded-[32px] border border-white/5 mb-8">
          <LegalItem title="Terms of Service" onPress={() => {}} />
          <LegalItem title="Privacy Policy" onPress={() => {}} />
          <LegalItem title="Cookie Policy" onPress={() => {}} />
          <LegalItem title="Community Guidelines" onPress={() => {}} />
          <LegalItem title="Software Licenses" onPress={() => {}} />
        </View>

        <View className="items-center mt-10 opacity-20">
          <Text className="text-white text-[10px] font-JakartaBold tracking-widest uppercase">
            Last Updated: June 2026
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LegalPrivacy;
