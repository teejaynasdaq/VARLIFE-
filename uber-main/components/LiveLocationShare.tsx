import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import React from "react";
import { TouchableOpacity, Text, View } from "react-native";

import { useRideStore } from "@/store/rideStore";

const LiveLocationShare = () => {
  const { origin, destination, matchedDriver } = useRideStore();

  const handleShare = async () => {
    if (!(await Sharing.isAvailableAsync())) {
      alert("Sharing is not available on this device");
      return;
    }

    const message = `Tracking my VARLIFE trip:\n\nDriver: ${matchedDriver?.name}\nVehicle: ${matchedDriver?.car}\nDestination: ${destination?.address}\n\nTrack me here: https://maps.google.com/?q=${origin?.latitude},${origin?.longitude}`;

    // Sharing.shareAsync requires a file URI, but for text we usually use native Share
    // Let's use the native Share from react-native for text
    const { Share } = await import("react-native");
    try {
      await Share.share({
        message: message,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleShare}
      className="flex-row items-center bg-dark-100 px-6 py-4 rounded-[32px] border border-neutral-900 mx-5"
    >
      <View className="w-10 h-10 bg-neutral-900 rounded-full items-center justify-center mr-4">
        <Ionicons name="share-social" size={20} color="white" />
      </View>
      <View className="flex-1">
        <Text className="text-white font-JakartaBold text-sm">
          Share Trip Live
        </Text>
        <Text className="text-neutral-500 text-[10px] uppercase font-JakartaMedium tracking-widest mt-0.5">
          Real-time tracking link
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#444" />
    </TouchableOpacity>
  );
};

export default LiveLocationShare;
