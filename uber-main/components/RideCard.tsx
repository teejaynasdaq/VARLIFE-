import { Image, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDate, formatTime } from "@/lib/utils";
import { Ride } from "@/types/type";

const RideCard = ({ ride }: { ride: Ride }) => {
  return (
    <View className="flex flex-col bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] mb-4 overflow-hidden">
      <View className="flex flex-col p-4">
        {/* Addresses */}
        <View className="flex-row items-start mb-4">
          <View className="items-center mr-4 pt-1">
            <View className="w-3 h-3 rounded-full bg-white" />
            <View className="w-[1px] h-8 bg-neutral-700 my-1" />
            <Ionicons name="location" size={14} color="#666" />
          </View>
          <View className="flex-1">
            <View className="mb-4">
              <Text className="text-white font-JakartaMedium text-sm" numberOfLines={2}>
                {ride.pickup_address}
              </Text>
            </View>
            <View>
              <Text className="text-white font-JakartaMedium text-sm" numberOfLines={2}>
                {ride.dropoff_address}
              </Text>
            </View>
          </View>
        </View>

        {/* Info Block */}
        <View className="flex flex-col w-full bg-[#141414] rounded-xl p-4 border border-[#2A2A2A]">
          <View className="flex flex-row items-center justify-between mb-3">
            <Text className="text-sm font-JakartaMedium text-neutral-500">
              Date & Time
            </Text>
            <Text className="text-sm font-JakartaBold text-white" numberOfLines={1}>
              {formatDate(ride.created_at)}, {formatTime(ride.duration_minutes || 0)}
            </Text>
          </View>

          <View className="flex flex-row items-center justify-between mb-3">
            <Text className="text-sm font-JakartaMedium text-neutral-500">
              Driver
            </Text>
            <View className="flex-row items-center">
              <Text className="text-sm font-JakartaBold text-white mr-2">
                {ride.driver?.first_name} {ride.driver?.last_name}
              </Text>
              {ride.driver && (
                <Ionicons name="star-outline" size={16} color="#666" />
              )}
            </View>
          </View>

          <View className="flex flex-row items-center justify-between mb-3">
            <Text className="text-sm font-JakartaMedium text-neutral-500">
              Fare
            </Text>
            <Text className="text-sm font-JakartaBold text-white">
              R{ride.fare_price?.toFixed(2)}
            </Text>
          </View>

          <View className="flex flex-row items-center justify-between">
            <Text className="text-sm font-JakartaMedium text-neutral-500">
              Status
            </Text>
            <Text
              className={`text-sm capitalize font-JakartaBold ${
                ride.status === "COMPLETED"
                  ? "text-white"
                  : ride.status === "CANCELLED"
                  ? "text-red-500"
                  : "text-neutral-400"
              }`}
            >
              {ride.status}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default RideCard;
