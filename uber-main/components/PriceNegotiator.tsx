import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";

import { useRideStore } from "@/store/rideStore";

const PriceNegotiator = () => {
  const { estimatedPrice, negotiatedPrice, setNegotiatedPrice } =
    useRideStore();

  useEffect(() => {
    if (estimatedPrice && !negotiatedPrice) {
      setNegotiatedPrice(estimatedPrice);
    }
  }, [estimatedPrice, negotiatedPrice, setNegotiatedPrice]);

  const handleAdjust = (amount: number) => {
    if (!negotiatedPrice) return;
    const nextPrice = negotiatedPrice + amount;

    // Safety check: Don't go below 60% of estimated price
    if (estimatedPrice && nextPrice < estimatedPrice * 0.6) return;

    setNegotiatedPrice(nextPrice);
  };

  if (!estimatedPrice) return null;

  return (
    <View className="bg-dark-100 p-6 rounded-[40px] border border-neutral-900 mx-5 mb-6">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-neutral-500 text-[10px] font-JakartaBold uppercase tracking-widest">
          Your Offer
        </Text>
        <Text className="text-neutral-500 text-[10px] font-JakartaBold uppercase tracking-widest">
          Rec: R{estimatedPrice}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => handleAdjust(-5)}
          className="w-14 h-14 bg-neutral-900 rounded-full items-center justify-center border border-neutral-800"
        >
          <Ionicons name="remove" size={24} color="white" />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-white text-5xl font-JakartaExtraBold">
            R{negotiatedPrice || estimatedPrice}
          </Text>
          <Text className="text-neutral-600 text-xs mt-1">
            Negotiable price
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => handleAdjust(5)}
          className="w-14 h-14 bg-neutral-900 rounded-full items-center justify-center border border-neutral-800"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PriceNegotiator;
