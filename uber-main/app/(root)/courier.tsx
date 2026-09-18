import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GoogleTextInput from "@/components/GoogleTextInput";
import PriceNegotiator from "@/components/PriceNegotiator";
import { useRideStore } from "@/store/rideStore";

const CourierScreen = () => {
  const router = useRouter();
  const {
    origin,
    setOrigin,
    destination,
    setDestination,
    setIsCourier,
    setEstimatedPrice,
  } = useRideStore();

  const [description, setDescription] = useState("");
  const [step, setStep] = useState(1); // 1: Locations, 2: Negotiation

  const handleNext = () => {
    if (!origin || !destination || !description) {
      Alert.alert(
        "Missing Info",
        "Please provide pickup, drop-off, and description.",
      );
      return;
    }

    // Calculate a base price for courier (simulated)
    setEstimatedPrice(120);
    setIsCourier(true);
    setStep(2);
  };

  const handleConfirm = () => {
    router.push("/(root)/confirm-ride" as any);
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
          VAR COURIER
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {step === 1 ? (
          <>
            <Text className="text-white text-3xl font-JakartaExtraBold mb-2">
              Send Anything
            </Text>
            <Text className="text-neutral-500 text-sm font-JakartaMedium mb-10">
              Premium door-to-door logistics service.
            </Text>

            <View className="mb-8">
              <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-4">
                Pickup & Drop-off
              </Text>
              <View className="bg-dark-100 p-6 rounded-[40px] border border-neutral-900">
                <View className="mb-6">
                  <GoogleTextInput
                    initialLocation={origin?.address || "Pickup Location"}
                    handlePress={(loc) => {
                      if (loc.latitude && loc.longitude && loc.address) {
                        setOrigin(
                          loc as {
                            latitude: number;
                            longitude: number;
                            address: string;
                          },
                        );
                      }
                    }}
                  />
                </View>
                <GoogleTextInput
                  initialLocation={
                    destination?.address || "Delivery Destination"
                  }
                  handlePress={(loc) => {
                    if (loc.latitude && loc.longitude && loc.address) {
                      setDestination(
                        loc as {
                          latitude: number;
                          longitude: number;
                          address: string;
                        },
                      );
                    }
                  }}
                />
              </View>
            </View>

            <View className="mb-10">
              <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-4">
                Parcel Details
              </Text>
              <View className="bg-dark-100 p-6 rounded-[32px] border border-neutral-900">
                <TextInput
                  placeholder="What are you sending? (e.g., Documents, Fashion items, Keys)"
                  placeholderTextColor="#555"
                  className="text-white font-JakartaMedium text-sm"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            <TouchableOpacity
              className="w-full bg-white py-5 rounded-full items-center"
              onPress={handleNext}
            >
              <Text className="text-black font-JakartaExtraBold text-lg">
                CHECK PRICE
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View className="items-center mb-10">
              <View className="w-24 h-24 bg-neutral-900 rounded-[32px] items-center justify-center mb-6">
                <Ionicons name="cube-outline" size={48} color="white" />
              </View>
              <Text className="text-white text-3xl font-JakartaExtraBold text-center">
                Negotiate Fee
              </Text>
              <Text className="text-neutral-500 text-sm font-JakartaMedium text-center mt-2 px-10">
                Propose your price for this delivery service.
              </Text>
            </View>

            <PriceNegotiator />

            <TouchableOpacity
              className="w-full bg-white py-5 rounded-full items-center mt-10"
              onPress={handleConfirm}
            >
              <Text className="text-black font-JakartaExtraBold text-lg">
                REQUEST COURIER
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full py-4 items-center mt-4"
              onPress={() => setStep(1)}
            >
              <Text className="text-neutral-500 font-JakartaBold text-sm uppercase">
                Back to details
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CourierScreen;
