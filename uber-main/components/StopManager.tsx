import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";

import { useRideStore } from "@/store/rideStore";

import GoogleTextInput from "./GoogleTextInput";

const StopManager = () => {
  const { stops, addStop, removeStop } = useRideStore();
  const [showSearch, setShowSearch] = useState(false);

  const handleAddStop = async (loc: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
  }) => {
    if (loc.latitude && loc.longitude && loc.address) {
      addStop(loc as { latitude: number; longitude: number; address: string });
      setShowSearch(false);
    }
  };

  return (
    <View className="px-5 mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-white text-lg font-JakartaBold">Trip Stops</Text>
        <Text className="text-neutral-500 text-[10px] font-JakartaBold uppercase tracking-widest">
          {stops.length} Added
        </Text>
      </View>

      {stops.map((stop: any, index: number) => (
        <View
          key={index}
          className="flex-row items-center mb-4 bg-dark-100 p-5 rounded-[24px] border border-neutral-900"
        >
          <View className="w-10 h-10 bg-neutral-900 rounded-2xl items-center justify-center mr-4">
            <Text className="text-white text-xs font-JakartaBold">
              {index + 1}
            </Text>
          </View>
          <Text
            className="text-white text-sm font-JakartaMedium flex-1"
            numberOfLines={1}
          >
            {stop.address}
          </Text>
          <TouchableOpacity onPress={() => removeStop(index)} className="ml-2">
            <Ionicons name="close-circle" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      ))}

      {stops.length < 3 && (
        <TouchableOpacity
          className="flex-row items-center justify-center py-5 rounded-[24px] border border-dashed border-neutral-800 bg-neutral-900/20"
          onPress={() => setShowSearch(true)}
        >
          <Ionicons name="add" size={20} color="#666" />
          <Text className="text-neutral-500 font-JakartaBold ml-2 uppercase tracking-widest text-[10px]">
            Add a stop
          </Text>
        </TouchableOpacity>
      )}

      <Modal visible={showSearch} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/80 justify-center p-6"
        >
          <View className="bg-dark-100 p-8 rounded-[40px] border border-neutral-800 shadow-2xl max-h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-JakartaExtraBold">
                Add a Stop
              </Text>
              <TouchableOpacity
                onPress={() => setShowSearch(false)}
                className="bg-neutral-900 p-2 rounded-full"
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <GoogleTextInput
                handlePress={handleAddStop}
                initialLocation="Where is this stop?"
                inlinePredictions={true}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default StopManager;
