import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { getActiveRideChats } from "@/lib/supabase";

const Chat = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChats = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getActiveRideChats(user.clerk_id ?? user.id);
      setRides(data);
    } catch {
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-6 pt-4 pb-6 border-b border-neutral-900">
        <Text className="text-white text-3xl font-JakartaExtraBold tracking-tight">
          Chat
        </Text>
        <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-[4px] mt-1">
          Ride Messages
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color="white" className="mt-10" />
      ) : rides.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10 py-20">
          <View className="w-28 h-28 rounded-[40px] bg-neutral-900 border border-neutral-800 items-center justify-center mb-8">
            <Ionicons name="chatbubbles-outline" size={52} color="#333" />
          </View>
          <Text className="text-white text-2xl font-JakartaExtraBold text-center mb-3">
            No Messages Yet
          </Text>
          <Text className="text-neutral-500 text-sm font-JakartaMedium text-center leading-6 px-4">
            Once you book a ride, you can message your driver directly from
            here.
          </Text>
        </View>
      ) : (
        <ScrollView className="px-5 pt-4">
          {rides.map((ride) => (
            <TouchableOpacity
              key={ride.id}
              className="flex-row items-center bg-dark-100 p-5 rounded-[32px] border border-neutral-900 mb-4"
              onPress={() =>
                router.push({
                  pathname: "/(root)/chat",
                  params: { rideId: ride.id },
                })
              }
            >
              <View className="w-12 h-12 rounded-full bg-neutral-900 items-center justify-center mr-4 overflow-hidden">
                {ride.drivers?.profile_image ? (
                  <Image
                    source={{ uri: ride.drivers.profile_image }}
                    className="w-full h-full"
                  />
                ) : (
                  <Ionicons name="person" size={22} color="#555" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-white font-JakartaBold">
                  {ride.drivers?.full_name ?? "Driver"}
                </Text>
                <Text
                  className="text-neutral-500 text-xs mt-1"
                  numberOfLines={1}
                >
                  {ride.dropoff_address}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-neutral-600 text-[10px] uppercase font-JakartaBold">
                  {ride.status}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#444"
                  className="mt-1"
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Chat;
