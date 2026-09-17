import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { getRideHistory, submitLostItemReport } from "@/lib/supabase";

const LostItemScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const rides = await getRideHistory(user.clerk_id ?? user.id);
        setTrips(
          (rides ?? [])
            .filter(
              (r: any) => (r.status ?? "").toLowerCase() === "completed",
            )
            .slice(0, 10),
        );
      } catch {
        setTrips([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleSubmit = async () => {
    if (!selectedTrip || !description || !user?.id) {
      Alert.alert("Error", "Please select a trip and describe the lost item.");
      return;
    }

    setSubmitting(true);
    try {
      await submitLostItemReport({
        user_id: user.clerk_id ?? user.id,
        ride_id: selectedTrip,
        description,
      });
      Alert.alert(
        "Report Submitted",
        "We've notified the driver and our support team. We'll get back to you shortly.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert(
        "Submission Failed",
        err.message ?? "Could not submit report. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-5 pt-2 flex-row items-center justify-between mb-8">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-dark-100 rounded-full items-center justify-center border border-neutral-900"
        >
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-JakartaExtraBold">
          LOST ITEM
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text className="text-white text-3xl font-JakartaExtraBold mb-2">
          Something left behind?
        </Text>
        <Text className="text-neutral-500 text-sm font-JakartaMedium mb-10">
          Select the ride where you might have left your item.
        </Text>

        <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-4">
          Recent Rides
        </Text>
        <View className="mb-10">
          {loading ? (
            <ActivityIndicator color="white" />
          ) : trips.length === 0 ? (
            <View className="bg-dark-100 p-10 rounded-[40px] items-center border border-neutral-900 border-dashed">
              <Ionicons name="receipt-outline" size={40} color="#333" />
              <Text className="text-neutral-600 font-JakartaBold mt-4">
                No completed rides found
              </Text>
            </View>
          ) : (
            trips.map((trip: any) => (
              <TouchableOpacity
                key={trip.id}
                onPress={() => setSelectedTrip(trip.id)}
                className={`flex-row items-center bg-dark-100 p-5 rounded-[32px] border mb-4 ${selectedTrip === trip.id ? "border-white" : "border-neutral-900"}`}
              >
                <View className="w-10 h-10 bg-neutral-900 rounded-full items-center justify-center mr-4">
                  <Ionicons name="car" size={20} color="white" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-white font-JakartaBold text-sm"
                    numberOfLines={1}
                  >
                    {trip.dropoff_address}
                  </Text>
                  <Text className="text-neutral-500 text-[10px] uppercase font-JakartaMedium tracking-widest mt-0.5">
                    {new Date(
                      trip.completed_at ?? trip.created_at,
                    ).toLocaleDateString()}{" "}
                    • R
                    {Number(
                      trip.final_price ?? trip.proposed_price ?? 0,
                    ).toFixed(2)}
                  </Text>
                </View>
                {selectedTrip === trip.id && (
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-4">
          Item Description
        </Text>
        <View className="bg-dark-100 p-6 rounded-[32px] border border-neutral-900 mb-10">
          <TextInput
            placeholder="What did you leave behind? (e.g., Black iPhone 13, Leather Wallet)"
            placeholderTextColor="#555"
            multiline
            numberOfLines={4}
            className="text-white font-JakartaMedium text-sm leading-6"
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          className={`w-full py-5 rounded-full items-center ${selectedTrip && description && !submitting ? "bg-white" : "bg-neutral-900"}`}
          disabled={!selectedTrip || !description || submitting}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text
              className={`font-JakartaExtraBold text-lg ${selectedTrip && description ? "text-black" : "text-neutral-600"}`}
            >
              SUBMIT REPORT
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LostItemScreen;
