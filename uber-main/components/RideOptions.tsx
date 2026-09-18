import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

import { calculateFare, RIDE_TYPE_MULTIPLIERS } from "@/lib/pricing";
import { useLocationStore } from "@/store";

export interface RideOption {
  id: string;
  title: string;
  tag: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const rideOptions: RideOption[] = [
  {
    id: "lite",
    title: "VAR Lite",
    tag: "AFFORDABLE",
    description: "Economy ride",
    icon: "car-outline",
  },
  {
    id: "go",
    title: "VAR Go",
    tag: "FAST",
    description: "Quick & reliable",
    icon: "flash-outline",
  },
  {
    id: "xl",
    title: "VAR XL",
    tag: "SPACIOUS",
    description: "Group ride",
    icon: "bus-outline",
  },
];

interface Props {
  onSelect: (option: RideOption) => void;
  selected: string | null;
  negotiatedPrice: number;
  onPriceChange: (price: number) => void;
  paymentMethod: "cash" | "payshap";
  onPaymentChange: (method: "cash" | "payshap") => void;
}

const RideOptions = ({
  onSelect,
  selected,
  negotiatedPrice,
  onPriceChange,
  paymentMethod,
  onPaymentChange,
}: Props) => {
  const { routeTime, routeDistance } = useLocationStore();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [recommended, setRecommended] = useState(0);

  // Keep latest values in refs so the effect below can read them without
  // needing them as dependencies (which would re-trigger the fare calc
  // whenever the parent passes a new inline onPriceChange).
  const negotiatedPriceRef = useRef(negotiatedPrice);
  const onPriceChangeRef = useRef(onPriceChange);
  useEffect(() => {
    negotiatedPriceRef.current = negotiatedPrice;
    onPriceChangeRef.current = onPriceChange;
  }, [negotiatedPrice, onPriceChange]);

  useEffect(() => {
    if (!routeTime || !routeDistance) return;
    const distanceKm = routeDistance / 1000;
    const durationMin = Math.round(routeTime / 60);

    (async () => {
      const next: Record<string, number> = {};
      for (const option of rideOptions) {
        const fare = await calculateFare({
          distanceKm,
          durationMinutes: durationMin,
          rideTypeMultiplier: RIDE_TYPE_MULTIPLIERS[option.id] ?? 1,
        });
        next[option.id] = fare.final_price;
      }
      setPrices(next);
      const rec = next.lite ?? next.go ?? 0;
      setRecommended(rec);
      if (!negotiatedPriceRef.current && rec > 0) {
        onPriceChangeRef.current(Math.round(rec));
      }
    })();
  }, [routeTime, routeDistance]);

  const formatTime = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  const adjustPrice = (delta: number) => {
    const next = Math.max(20, negotiatedPrice + delta);
    onPriceChange(next);
  };

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-5 mb-6"
        contentContainerStyle={{ gap: 12 }}
      >
        {rideOptions.map((item) => {
          const isSelected = selected === item.id;
          const price = prices[item.id];
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelect(item)}
              className={`w-44 rounded-2xl p-4 border ${
                isSelected
                  ? "bg-white border-white"
                  : "bg-neutral-900 border-neutral-800"
              }`}
            >
              <Text
                className={`text-[9px] font-JakartaBold tracking-widest mb-4 ${
                  isSelected ? "text-neutral-500" : "text-neutral-600"
                }`}
              >
                {item.tag}
              </Text>
              <View className="mb-4">
                <Ionicons
                  name={item.icon}
                  size={32}
                  color={isSelected ? "#000" : "#FFF"}
                />
              </View>
              <Text
                className={`text-base font-JakartaExtraBold mt-2 flex-shrink ${
                  isSelected ? "text-black" : "text-white"
                }`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.title}
              </Text>
              <Text
                className={`text-xs font-JakartaMedium mt-1 flex-shrink ${
                  isSelected ? "text-neutral-500" : "text-neutral-500"
                }`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.description}
              </Text>
              <View className="flex-row justify-between items-end mt-3">
                <Text
                  className={`text-xs ${
                    isSelected ? "text-neutral-500" : "text-neutral-600"
                  }`}
                >
                  {routeTime ? formatTime(routeTime) : "—"}
                </Text>
                <Text
                  className={`text-lg font-JakartaExtraBold ${
                    isSelected ? "text-black" : "text-white"
                  }`}
                >
                  R{price ? Math.round(price) : "—"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View className="mx-5 bg-[#1E1E1E] rounded-2xl p-5 border border-[#2A2A2A] mb-6">
        <View className="flex-row justify-between mb-4">
          <Text className="text-neutral-500 text-[10px] font-JakartaBold uppercase tracking-widest">
            Your Offer
          </Text>
          <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest">
            Rec: R{Math.round(recommended)}
          </Text>
        </View>
        <View className="flex-row items-center justify-center">
          <TouchableOpacity
            onPress={() => adjustPrice(-5)}
            style={styles.adjustBtn}
          >
            <Text className="text-white text-2xl font-JakartaBold">−</Text>
          </TouchableOpacity>
          <Text className="text-white text-4xl font-JakartaExtraBold mx-8">
            R{negotiatedPrice}
          </Text>
          <TouchableOpacity
            onPress={() => adjustPrice(5)}
            style={styles.adjustBtn}
          >
            <Text className="text-white text-2xl font-JakartaBold">+</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-neutral-600 text-xs font-JakartaMedium text-center mt-3">
          Negotiable price
        </Text>
      </View>

      <Text className="text-neutral-500 text-[10px] font-JakartaBold uppercase tracking-widest px-5 mb-3">
        Payment Method
      </Text>
      <View className="flex-row px-5 gap-3 mb-6">
        {/* Cash button — glass tinted */}
        <TouchableOpacity
          onPress={() => onPaymentChange("cash")}
          style={[
            styles.paymentBtn,
            paymentMethod === "cash"
              ? styles.paymentBtnActive
              : styles.paymentBtnInactive,
          ]}
        >
          <Ionicons
            name="cash-outline"
            size={20}
            color={paymentMethod === "cash" ? "#000" : "#FFF"}
          />
          <Text
            style={[
              styles.paymentBtnLabel,
              { color: paymentMethod === "cash" ? "#000" : "#fff" },
            ]}
          >
            Cash
          </Text>
        </TouchableOpacity>

        {/* PayShap button — glass tinted */}
        <TouchableOpacity
          onPress={() => onPaymentChange("payshap")}
          style={[
            styles.paymentBtn,
            paymentMethod === "payshap"
              ? styles.paymentBtnActive
              : styles.paymentBtnInactive,
          ]}
        >
          <Ionicons
            name="card-outline"
            size={20}
            color={paymentMethod === "payshap" ? "#000" : "#FFF"}
          />
          <Text
            style={[
              styles.paymentBtnLabel,
              { color: paymentMethod === "payshap" ? "#000" : "#fff" },
            ]}
          >
            PayShap
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  adjustBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  paymentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentBtnActive: {
    backgroundColor: "rgba(255,255,255,0.90)",
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#fff",
  },
  paymentBtnInactive: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
  },
  paymentBtnLabel: {
    marginLeft: 8,
    fontFamily: "Jakarta-Bold",
    fontSize: 14,
  },
});

export default RideOptions;
