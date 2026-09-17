import { useEffect, useState, useCallback } from "react";
import { FlatList, Image, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import RideCard from "@/components/RideCard";
import { Skeleton } from "@/components/Skeleton";
import { images } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { normalizeRideForCard } from "@/lib/fetch";
import { getRideHistory } from "@/lib/supabase";
import { Ride } from "@/types/type";

const Rides = () => {
  const { user } = useAuth();
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("past");

  const loadRides = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getRideHistory(user.clerk_id ?? user.id);
      setRecentRides((data ?? []).map(normalizeRideForCard));
    } catch (err: any) {
      setError(err.message ?? "Failed to load rides");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRides();
  }, [loadRides]);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-5 pt-2 mb-4">
        <Text className="text-2xl font-JakartaExtraBold text-white mb-4">Your Rides</Text>
        <View className="flex-row bg-neutral-900 rounded-full p-1 border border-neutral-800">
          <TouchableOpacity
            onPress={() => setActiveTab("upcoming")}
            className={`flex-1 py-2.5 rounded-full items-center ${activeTab === "upcoming" ? "bg-white" : "bg-transparent"}`}
          >
            <Text className={`font-JakartaBold ${activeTab === "upcoming" ? "text-black" : "text-neutral-500"}`}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("past")}
            className={`flex-1 py-2.5 rounded-full items-center ${activeTab === "past" ? "bg-white" : "bg-transparent"}`}
          >
            <Text className={`font-JakartaBold ${activeTab === "past" ? "text-black" : "text-neutral-500"}`}>Past</Text>
          </TouchableOpacity>
        </View>
      </View>
      {loading && recentRides.length === 0 ? (
        <View className="px-5 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="bg-dark-100 p-6 rounded-[32px] mb-6 border border-neutral-900 shadow-sm">
              <View className="flex-row justify-between mb-6">
                <View>
                  <Skeleton width={100} height={12} style={{ marginBottom: 8 }} />
                  <Skeleton width={60} height={18} />
                </View>
                <View className="items-end">
                  <Skeleton width={80} height={24} style={{ marginBottom: 6 }} />
                  <Skeleton width={50} height={10} />
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="items-center mr-5">
                  <Skeleton width={10} height={10} borderRadius={5} />
                  <Skeleton width={1} height={40} style={{ marginVertical: 4 }} />
                  <Skeleton width={14} height={14} borderRadius={7} />
                </View>
                <View className="flex-1">
                  <View className="mb-5">
                    <Skeleton width="80%" height={16} style={{ marginBottom: 6 }} />
                    <Skeleton width={100} height={10} />
                  </View>
                  <View>
                    <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
                    <Skeleton width={100} height={10} />
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={activeTab === "upcoming" ? recentRides.filter(r => !["COMPLETED", "CANCELLED"].includes((r.status || "").toUpperCase())) : recentRides.filter(r => ["COMPLETED", "CANCELLED"].includes((r.status || "").toUpperCase()))}
          renderItem={({ item }) => <RideCard ride={item} />}
          keyExtractor={(item) => item.id ?? String(Math.random())}
          className="px-5"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: 120,
          }}
          refreshing={loading}
          onRefresh={loadRides}
          ListEmptyComponent={() => (
            <View className="flex flex-col items-center justify-center mt-10">
              <Image
                source={images.noResult}
                className="w-40 h-40"
                alt="No recent rides found"
                resizeMode="contain"
              />
              <Text className="text-sm text-neutral-400 mt-5">
                {error ?? "No recent rides found"}
              </Text>
            </View>
          )}
          ListHeaderComponent={null}
        />
      )}
    </SafeAreaView>
  );
};

export default Rides;
