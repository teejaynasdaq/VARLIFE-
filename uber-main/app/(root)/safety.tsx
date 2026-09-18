import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SafetyCenter() {
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
          Safety Center
        </Text>
      </View>

      <ScrollView className="flex-1 px-5">
        <TouchableOpacity
          className="bg-[#1E1E1E] rounded-xl p-5 mb-4 border border-[#2A2A2A] flex-row items-center"
          onPress={() => Linking.openURL("tel:112")}
        >
          <Ionicons name="call" size={24} color="#FF3B30" />
          <View className="ml-4 flex-1">
            <Text className="text-white font-JakartaBold text-lg">
              Emergency Assistance
            </Text>
            <Text className="text-neutral-500 font-JakartaMedium text-sm mt-1">
              Call local emergency services
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-[#1E1E1E] rounded-xl p-5 mb-4 border border-[#2A2A2A] flex-row items-center"
          onPress={() =>
            Share.share({ message: "Track my VARLIFE ride live." })
          }
        >
          <Ionicons name="share-social" size={24} color="white" />
          <View className="ml-4 flex-1">
            <Text className="text-white font-JakartaBold text-lg">
              Share Trip Status
            </Text>
            <Text className="text-neutral-500 font-JakartaMedium text-sm mt-1">
              Let contacts track your ride
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity className="bg-[#1E1E1E] rounded-xl p-5 mb-4 border border-[#2A2A2A] flex-row items-center">
          <Ionicons name="alert-circle" size={24} color="#F5A623" />
          <View className="ml-4 flex-1">
            <Text className="text-white font-JakartaBold text-lg">
              Report a Safety Issue
            </Text>
            <Text className="text-neutral-500 font-JakartaMedium text-sm mt-1">
              Report driving or behavior issues
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#666" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
