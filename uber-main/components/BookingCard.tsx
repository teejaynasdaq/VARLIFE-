import { Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity } from "react-native";

interface BookingCardProps {
  currentAddress?: string | null;
  onDestinationSelect: () => void;
  userId?: string;
}

export default function BookingCard({
  currentAddress,
  onDestinationSelect,
}: BookingCardProps) {
  return (
    <View className="mx-5 mt-4 bg-neutral-950/95 rounded-[28px] border border-neutral-800/80 p-5 shadow-2xl">
      <View className="flex-row items-start mb-1">
        <View className="items-center mr-4 pt-1">
          <View className="w-3 h-3 rounded-full bg-white" />
          <View className="w-[1px] h-8 bg-neutral-700 my-1" />
          <View className="w-3 h-3 border-2 border-white bg-transparent" />
        </View>
        <View className="flex-1 gap-4">
          <View>
            <Text className="text-neutral-500 text-[10px] font-JakartaBold uppercase tracking-widest mb-1">
              Pickup
            </Text>
            <Text
              className="text-white font-JakartaMedium text-sm"
              numberOfLines={2}
            >
              {currentAddress || "Getting location..."}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onDestinationSelect}
            className="bg-[#1E1E1E] rounded-full px-5 py-4 flex-row items-center"
          >
            <Ionicons name="search" size={18} color="#666" />
            <Text className="text-neutral-500 font-JakartaMedium text-[15px] ml-3">
              Where are you going?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
