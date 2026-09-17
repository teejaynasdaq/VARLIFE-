import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

import { useRideStore } from "@/store/rideStore";

const PassengerSelector = () => {
  const { passengerCount, setPassengerCount } = useRideStore();
  const options: (2 | 4 | 6)[] = [2, 4, 6];

  return (
    <View className="px-5 mb-6">
      <Text className="text-neutral-500 text-[10px] font-JakartaBold uppercase tracking-widest mb-3">
        Select Capacity
      </Text>
      <View className="flex-row justify-start">
        {options.map((count) => {
          const isSelected = passengerCount === count;
          return (
            <TouchableOpacity
              key={count}
              onPress={() => setPassengerCount(count)}
              activeOpacity={0.8}
              className={`flex-row items-center justify-center px-6 py-2.5 rounded-full mr-3 border ${
                isSelected
                  ? "bg-white border-white"
                  : "bg-neutral-900 border-neutral-800"
              }`}
            >
              <Ionicons
                name="person"
                size={12}
                color={isSelected ? "black" : "#777"}
              />
              <Text
                className={`ml-1.5 font-JakartaExtraBold text-xs ${
                  isSelected ? "text-black" : "text-neutral-400"
                }`}
              >
                {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default PassengerSelector;
