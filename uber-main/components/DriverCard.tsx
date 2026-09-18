import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  Linking,
  Share,
} from "react-native";

import { Driver } from "@/types/type";

interface Props {
  driver: Driver;
  onCancel: () => void;
  eta: string;
  vehiclePlate?: string;
  rideId?: string;
  status?: "arriving" | "in_trip";
}

const DriverCard = ({
  driver,
  onCancel,
  eta,
  vehiclePlate,
  rideId,
  status = "arriving",
}: Props) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleMessage = () => {
    if (rideId) {
      router.push({ pathname: "/(root)/chat", params: { rideId } });
    }
  };

  const handleCall = () => {
    Linking.openURL("tel:0800000000");
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I'm on a VARLIFE ride${vehiclePlate ? ` — vehicle plate: ${vehiclePlate}` : ""}. Track my trip for safety.`,
      });
    } catch {}
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View className="bg-[#0D0D0D] p-6 rounded-t-[32px] border-t border-[#2A2A2A]">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-5">
          <Text className="text-white text-xl font-JakartaExtraBold">
            {status === "in_trip" ? "Trip In Progress" : "Driver On The Way"}
          </Text>
          <View className="bg-[#1E1E1E] px-4 py-2 rounded-full border border-[#2A2A2A]">
            <Text className="text-white text-sm font-JakartaBold">
              {status === "in_trip" ? "En route" : eta}
            </Text>
          </View>
        </View>{" "}
        {/* Driver Info Row */}
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-14 h-14 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] overflow-hidden items-center justify-center">
              {driver.profile_image_url ? (
                <Image
                  source={{ uri: driver.profile_image_url }}
                  className="w-full h-full"
                />
              ) : (
                <Ionicons name="person" size={24} color="#888" />
              )}
            </View>
            <View className="ml-3 flex-1">
              <Text
                className="text-white text-base font-JakartaBold"
                numberOfLines={1}
              >
                {driver.first_name || "Driver"}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <Ionicons name="star" size={12} color="#FFF" />
                <Text className="text-white text-xs font-JakartaBold ml-1">
                  {(driver.rating ?? 5.0).toFixed(2)}
                </Text>
                <Text className="text-neutral-500 text-xs mx-1.5">•</Text>
                <Text className="text-neutral-400 text-[11px] font-JakartaMedium">
                  Level 04 Artist
                </Text>
              </View>
              <Text
                className="text-neutral-400 text-xs mt-0.5"
                numberOfLines={1}
              >
                White Toyota Corolla
              </Text>
              <Text
                className="text-neutral-500 text-[10px] font-JakartaMedium mt-0.5"
                numberOfLines={1}
              >
                {vehiclePlate || "ABC 123 MP"}
              </Text>
            </View>
          </View>

          {/* Circular Actions */}
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share trip details"
              className="w-10 h-10 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] items-center justify-center"
            >
              <Ionicons name="share-social" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCall}
              accessibilityRole="button"
              accessibilityLabel="Call driver"
              className="w-10 h-10 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] items-center justify-center"
            >
              <Ionicons name="call" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleMessage}
              disabled={!rideId}
              accessibilityRole="button"
              accessibilityLabel="Message driver"
              className="w-10 h-10 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] items-center justify-center"
            >
              <Ionicons name="chatbubble" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Pickup Spot Section */}
        {status === "arriving" && (
          <View className="mb-5">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-neutral-500 text-[10px] font-JakartaBold uppercase tracking-widest">
                Pickup spot
              </Text>
              <TouchableOpacity>
                <Text className="text-white text-xs font-JakartaBold">
                  View
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row bg-[#1E1E1E] rounded-2xl overflow-hidden border border-[#2A2A2A] p-3">
              <View className="w-16 h-16 bg-[#121212] rounded-xl items-center justify-center border border-[#2A2A2A] mr-3">
                <Ionicons name="location" size={24} color="#FFF" />
              </View>
              <View className="flex-1 justify-center">
                <Text className="text-white text-sm font-JakartaBold mb-0.5">
                  Main Taxi Rank
                </Text>
                <Text className="text-neutral-400 text-xs font-JakartaMedium mb-0.5">
                  Bushbuckridge
                </Text>
                <Text
                  className="text-neutral-500 text-[10px] font-JakartaMedium"
                  numberOfLines={2}
                >
                  Meet at the covered area near the taxi rank entrance.
                </Text>
              </View>
            </View>
          </View>
        )}
        {/* Safety Button */}
        <TouchableOpacity
          onPress={() => router.push("/(root)/safety" as any)}
          className="w-full py-4 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] flex-row items-center justify-center"
        >
          <Ionicons name="shield-half-sharp" size={18} color="white" />
          <Text className="text-white text-base font-JakartaBold text-center ml-2">
            Safety
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default DriverCard;
