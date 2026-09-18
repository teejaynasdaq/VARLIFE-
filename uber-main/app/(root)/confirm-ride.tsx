import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocationStore } from "@/store";

export default function ConfirmRide() {
  const { destinationAddress } = useLocationStore();

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
          Confirm Delivery
        </Text>
      </View>

      <View className="flex-1 px-5 justify-center items-center">
        <Ionicons name="cube-outline" size={64} color="#333" />
        <Text className="text-white text-2xl font-JakartaExtraBold mt-6 text-center">
          Ready to send?
        </Text>
        <Text className="text-neutral-500 text-sm font-JakartaMedium text-center mt-3 px-8">
          {destinationAddress
            ? `Deliver to ${destinationAddress}`
            : "Set a destination on the home screen to book a courier ride."}
        </Text>

        <TouchableOpacity
          className="bg-white px-10 py-4 rounded-full mt-10"
          onPress={() => router.replace("/(root)/(tabs)/home")}
        >
          <Text className="text-black font-JakartaBold text-lg">
            Continue on Home
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
