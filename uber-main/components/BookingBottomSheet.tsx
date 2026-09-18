import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useState, useMemo, forwardRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocationStore } from "@/store";
import { useRideStore } from "@/store/rideStore";

import RideOptions from "./RideOptions";

interface Props {
  onAddStop: () => void;
  onRequestRide: (
    rideType: string,
    offerAmount: number,
    paymentMethod: "cash" | "payshap",
  ) => void;
  isCreatingRide: boolean;
}

const BookingBottomSheet = forwardRef<BottomSheet, Props>(
  ({ onAddStop, onRequestRide, isCreatingRide }, ref) => {
    const { userAddress, destinationAddress, routeDistance, routeTime } =
      useLocationStore();
    const { stops, passengerCount, setPassengerCount } = useRideStore();

    const [isChooseRideExpanded, setIsChooseRideExpanded] = useState(true);
    const [selectedRide, setSelectedRide] = useState<string | null>(null);
    const [negotiatedPrice, setNegotiatedPrice] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "payshap">(
      "cash",
    );

    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ["45%", "90%"], []);

    const formatTime = (seconds: number) => {
      const min = Math.round(seconds / 60);
      return `${min} min`;
    };

    return (
      <BottomSheet
        ref={ref}
        snapPoints={snapPoints}
        index={1}
        enablePanDownToClose={false}
        handleIndicatorStyle={{ backgroundColor: "#333", width: 40 }}
        backgroundStyle={{ backgroundColor: "#171717", borderRadius: 32 }}
      >
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* YOUR TRIP SECTION */}
          <View className="px-5 mb-4 mt-2">
            <Text className="text-white text-2xl font-JakartaExtraBold mb-4">
              Your Trip
            </Text>

            <View className="bg-transparent mb-4">
              {/* Route Line Graphics & Addresses */}
              <View className="flex-row mb-6">
                <View className="items-center mr-4 mt-1">
                  <View className="w-[14px] h-[14px] rounded-full bg-white" />
                  <View className="w-[1px] flex-1 bg-[#444] my-1" />
                  {stops.length > 0 &&
                    stops.map((_, i) => (
                      <View key={`line-${i}`} className="items-center flex-1">
                        <View className="w-2 h-2 rounded-full bg-[#888]" />
                        <View className="w-[1px] flex-1 bg-[#444] my-1" />
                      </View>
                    ))}
                  <View className="w-[14px] h-[14px] border-[2px] border-white bg-transparent mb-1" />
                </View>
                <View className="flex-1 justify-between gap-6">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-[#888] text-[10px] font-JakartaBold uppercase mb-1">
                        Pickup
                      </Text>
                      <Text
                        className="text-white font-JakartaMedium text-[15px]"
                        numberOfLines={1}
                      >
                        {userAddress || "Current Location"}
                      </Text>
                    </View>
                    <TouchableOpacity className="bg-[#1A1A1A] px-4 py-1.5 rounded-full border border-[#2A2A2A]">
                      <Text className="text-white text-[10px] font-JakartaBold">
                        Edit
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {stops.map((stop: any, index: number) => (
                    <View
                      key={`stop-${index}`}
                      className="flex-row items-center justify-between"
                    >
                      <View className="flex-1">
                        <Text className="text-[#888] text-[10px] font-JakartaBold uppercase mb-1">
                          Stop {index + 1}
                        </Text>
                        <Text
                          className="text-white font-JakartaMedium text-[15px]"
                          numberOfLines={1}
                        >
                          {stop.address}
                        </Text>
                      </View>
                      <TouchableOpacity className="bg-[#1A1A1A] px-4 py-1.5 rounded-full border border-[#2A2A2A]">
                        <Text className="text-white text-[10px] font-JakartaBold">
                          Edit
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-[#888] text-[10px] font-JakartaBold uppercase mb-1">
                        Drop-off
                      </Text>
                      <Text
                        className="text-white font-JakartaMedium text-[15px]"
                        numberOfLines={1}
                      >
                        {destinationAddress}
                      </Text>
                    </View>
                    <TouchableOpacity className="bg-[#1A1A1A] px-4 py-1.5 rounded-full border border-[#2A2A2A]">
                      <Text className="text-white text-[10px] font-JakartaBold">
                        Edit
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Action Pills */}
              {stops.length < 2 && (
                <TouchableOpacity
                  onPress={onAddStop}
                  className="bg-[#1A1A1A] rounded-full px-4 py-2 border border-[#2A2A2A] flex-row items-center self-start mb-4"
                >
                  <Ionicons name="add" size={14} color="#FFF" />
                  <Text className="text-white text-xs font-JakartaBold ml-1.5">
                    Add stop
                  </Text>
                </TouchableOpacity>
              )}

              {/* Summary Pills */}
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() =>
                    setPassengerCount(
                      passengerCount === 6 ? 2 : passengerCount + 2,
                    )
                  }
                  className="flex-row items-center bg-[#1A1A1A] px-4 py-2 rounded-full border border-[#2A2A2A]"
                >
                  <Ionicons name="person-outline" size={14} color="#888" />
                  <Text className="text-white text-xs font-JakartaBold ml-2">
                    1-{passengerCount} seats
                  </Text>
                </TouchableOpacity>
                <View className="flex-row items-center bg-[#1A1A1A] px-4 py-2 rounded-full border border-[#2A2A2A]">
                  <Ionicons name="time-outline" size={14} color="#888" />
                  <Text className="text-white text-xs font-JakartaBold ml-2">
                    {routeTime ? formatTime(routeTime) : "—"}
                  </Text>
                </View>
                <View className="flex-row items-center bg-[#1A1A1A] px-4 py-2 rounded-full border border-[#2A2A2A]">
                  <Ionicons name="car-outline" size={14} color="#888" />
                  <Text className="text-white text-xs font-JakartaBold ml-2">
                    {routeDistance ? (routeDistance / 1000).toFixed(1) : "—"} km
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="mb-4">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsChooseRideExpanded(!isChooseRideExpanded)}
              className="flex-row items-center justify-between px-5 py-4"
            >
              <Text className="text-white text-xl font-JakartaExtraBold">
                Choose a ride
              </Text>
              <Ionicons
                name={isChooseRideExpanded ? "chevron-up" : "chevron-down"}
                size={24}
                color="#FFF"
              />
            </TouchableOpacity>

            {isChooseRideExpanded && (
              <RideOptions
                selected={selectedRide}
                onSelect={(opt) => setSelectedRide(opt.id)}
                negotiatedPrice={negotiatedPrice}
                onPriceChange={setNegotiatedPrice}
                paymentMethod={paymentMethod}
                onPaymentChange={setPaymentMethod}
              />
            )}
          </View>
        </BottomSheetScrollView>

        {/* FLOATING REQUEST BUTTON */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-[#0D0D0D] px-5 pt-4 border-t border-[#1E1E1E]"
          style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
        >
          <TouchableOpacity
            onPress={() => {
              if (selectedRide)
                onRequestRide(selectedRide, negotiatedPrice, paymentMethod);
            }}
            disabled={!selectedRide || isCreatingRide}
            style={[
              styles.requestBtn,
              selectedRide && !isCreatingRide
                ? styles.requestBtnActive
                : styles.requestBtnDisabled,
            ]}
            activeOpacity={0.78}
          >
            {isCreatingRide ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text
                style={[
                  styles.requestBtnLabel,
                  { color: selectedRide ? "#000" : "rgba(255,255,255,0.35)" },
                ]}
              >
                Request{" "}
                {selectedRide === "go"
                  ? "GO"
                  : selectedRide === "lite"
                    ? "LITE"
                    : selectedRide === "xl"
                      ? "XL"
                      : "Ride"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  requestBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  requestBtnActive: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#fff",
  },
  requestBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
  },
  requestBtnLabel: {
    fontFamily: "Jakarta-ExtraBold",
    fontSize: 18,
    letterSpacing: -0.2,
  },
});

BookingBottomSheet.displayName = "BookingBottomSheet";

export default BookingBottomSheet;
