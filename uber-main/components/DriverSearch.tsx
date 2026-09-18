import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";

interface Props {
  onCancel: () => void;
}

const DriverSearch = ({ onCancel }: Props) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <View className="bg-[#0D0D0D] p-6 rounded-t-[32px] border-t border-[#2A2A2A] shadow-2xl h-[340px]">
      <Text className="text-xl font-JakartaExtraBold mb-2 text-center text-white">
        Finding your driver
      </Text>
      <Text className="text-sm font-JakartaMedium mb-8 text-center text-neutral-400">
        Connecting to nearby VARLIFE drivers...
      </Text>

      <View className="flex-1 justify-center items-center">
        <Animated.View
          className="w-24 h-24 rounded-full bg-[#1E1E1E] border border-[#333] items-center justify-center mb-5"
          style={{ transform: [{ scale: pulseAnim }] }}
        >
          <Ionicons name="car" size={40} color="white" />
        </Animated.View>
      </View>

      <TouchableOpacity
        onPress={onCancel}
        className="w-full py-4 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] mt-5"
      >
        <Text className="text-lg font-JakartaBold text-center text-neutral-400">
          Cancel Request
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default DriverSearch;
