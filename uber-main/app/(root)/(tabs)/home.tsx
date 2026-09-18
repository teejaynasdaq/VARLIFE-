import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  StatusBar,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import BookingBottomSheet from "@/components/BookingBottomSheet";
import BookingCard from "@/components/BookingCard";
import DriverCard from "@/components/DriverCard";
import DriverSearch from "@/components/DriverSearch";
import GoogleMap from "@/components/GoogleMap";
import GoogleTextInput from "@/components/GoogleTextInput";
import VarlifeDrawer from "@/components/VarlifeDrawer";
import { icons } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { mapSupabaseDriver } from "@/lib/fetch";
import { googleMaps } from "@/lib/googleMaps";
import { generateMarkersFromData } from "@/lib/map";
import { notifyLocal } from "@/lib/notifications";
import { getTimeBasedHint } from "@/lib/rideRecommendations";
import { toDbStatus } from "@/lib/rideStatus";
import {
  supabase,
  createRide,
  cancelRide,
  getNearbyOnlineDrivers,
} from "@/lib/supabase";
import { useDriverStore, useLocationStore } from "@/store";
import { useRideStore } from "@/store/rideStore";
import { Driver } from "@/types/type";

const MATCH_TIMEOUT_MS = 120000;

const Home = () => {
  const { user, signOut, isGuest } = useAuth();
  const {
    setUserLocation,
    setDestinationLocation,
    destinationAddress,
    destinationLatitude,
    destinationLongitude,
    userLatitude,
    userLongitude,
    userAddress,
    routeTime,
    routeDistance,
  } = useLocationStore();
  const { setSelectedDriver, setDrivers } = useDriverStore();
  const { setCurrentRideId } = useRideStore();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [step, setStep] = useState<
    "search" | "booking" | "searching" | "driver_assigned" | "in_trip"
  >("search");
  const [isDestinationSearchOpen, setIsDestinationSearchOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<"destination" | "stop">(
    "destination",
  );
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(null);
  const [vehiclePlate, setVehiclePlate] = useState<string>("");
  const [eta, setEta] = useState("—");
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [isCreatingRide, setIsCreatingRide] = useState(false);
  const params = useLocalSearchParams();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const matchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearMatchTimeout = useCallback(() => {
    if (matchTimeoutRef.current) {
      clearTimeout(matchTimeoutRef.current);
      matchTimeoutRef.current = null;
    }
  }, []);

  const resetRideFlow = useCallback(() => {
    clearMatchTimeout();
    setActiveRideId(null);
    setCurrentRideId(null);
    setAssignedDriver(null);
    setStep("search");
    setDestinationLocation({
      latitude: null,
      longitude: null,
      address: null,
    });
  }, [clearMatchTimeout, setCurrentRideId, setDestinationLocation]);

  const loadNearbyDrivers = useCallback(async () => {
    if (!userLatitude || !userLongitude) return;
    const nearby = await getNearbyOnlineDrivers(userLatitude, userLongitude);
    const mapped = nearby.map((d, i) => mapSupabaseDriver(d, i));
    const markers = generateMarkersFromData({
      data: mapped,
      userLatitude,
      userLongitude,
    });
    setDrivers(markers);
  }, [userLatitude, userLongitude, setDrivers]);

  useEffect(() => {
    loadNearbyDrivers();
    const interval = setInterval(loadNearbyDrivers, 30000);
    return () => clearInterval(interval);
  }, [loadNearbyDrivers]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const address = await googleMaps.reverseGeocode(
        location.coords.latitude,
        location.coords.longitude,
      );
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address || "Current location",
      });
    })();
  }, [setUserLocation]);

  // Handle returning from a search or booking flow if we want to reset
  useEffect(() => {
    if (
      destinationLatitude &&
      destinationLongitude &&
      step === "search" &&
      !isDestinationSearchOpen
    ) {
      setStep("booking");
    }
  }, [
    destinationLatitude,
    destinationLongitude,
    step,
    isDestinationSearchOpen,
  ]);

  useEffect(() => {
    if (params.startSearch === "true" && params.rideId && step === "search") {
      setStep("searching");
      setActiveRideId(params.rideId as string);
      router.setParams({ startSearch: undefined, rideId: undefined });

      matchTimeoutRef.current = setTimeout(() => {
        Alert.alert(
          "No Drivers Available",
          "We couldn't find a driver nearby. Would you like to keep searching or cancel?",
          [
            {
              text: "Keep Searching",
              onPress: () => {
                matchTimeoutRef.current = setTimeout(async () => {
                  await cancelRide(
                    params.rideId as string,
                    "system",
                    "Match timeout",
                  );
                  Alert.alert(
                    "Search Expired",
                    "Please try again when more drivers are online.",
                  );
                  resetRideFlow();
                }, MATCH_TIMEOUT_MS);
              },
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: async () => {
                await cancelRide(
                  params.rideId as string,
                  "user",
                  "No drivers found",
                );
                resetRideFlow();
              },
            },
          ],
        );
      }, MATCH_TIMEOUT_MS);
    }
  }, [params.startSearch, params.rideId, step, resetRideFlow]);

  const handleDriverAccepted = useCallback(
    async (ride: any) => {
      if (!ride.driver_id) return;

      const { data: driver } = await supabase
        .from("drivers")
        .select("*, users(first_name, last_name, profile_image_url, rating)")
        .eq("id", ride.driver_id)
        .maybeSingle();

      const d: any = driver;
      if (d) {
        const mapped = {
          ...d,
          full_name: d.users
            ? `${d.users.first_name ?? ""} ${d.users.last_name ?? ""}`.trim()
            : "VARLIFE Driver",
          profile_image: d.users?.profile_image_url,
          rating: d.users?.rating ?? 5,
          vehicle_plate: d.vehicle_registration,
        };
        setAssignedDriver(mapSupabaseDriver(mapped));
        setVehiclePlate(d.vehicle_registration ?? "");
        setSelectedDriver(1);
      }

      if (userLatitude && userLongitude && d?.current_lat && d?.current_lng) {
        try {
          const matrix = await googleMaps.getDistanceMatrix(
            d.current_lat,
            d.current_lng,
            userLatitude,
            userLongitude,
          );
          if (matrix?.durationText) setEta(matrix.durationText);
        } catch {
          setEta("5 min");
        }
      } else {
        setEta("5 min");
      }

      clearMatchTimeout();
      setStep("driver_assigned");
    },
    [userLatitude, userLongitude, setSelectedDriver, clearMatchTimeout],
  );

  useEffect(() => {
    if (!activeRideId || step !== "searching") return;

    const channel = supabase
      .channel(`rider_ride_${activeRideId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: `id=eq.${activeRideId}`,
        },
        (payload) => {
          const ride = payload.new as any;
          const status = toDbStatus(ride.status);
          if (status === "accepted") {
            handleDriverAccepted(ride);
            notifyLocal("Driver Found!", "Your driver is on the way.");
          } else if (status === "started") {
            setStep("in_trip");
            notifyLocal("Ride Started", "Your trip is now in progress.");
          } else if (status === "completed") {
            Alert.alert("Ride Complete", "Thank you for riding with VARLIFE.");
            resetRideFlow();
          } else if (status === "cancelled") {
            Alert.alert(
              "Ride Cancelled",
              "Your ride was cancelled. Please try again.",
            );
            resetRideFlow();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRideId, step, handleDriverAccepted, resetRideFlow]);

  const handleDestinationPress = () => {
    setSearchMode("destination");
    setIsDestinationSearchOpen(true);
  };

  const handleDestinationSelect = (location: any) => {
    if (searchMode === "destination") {
      setDestinationLocation(location);
    } else {
      useRideStore.getState().addStop(location);
    }
    setIsDestinationSearchOpen(false);
    setSearchMode("destination");
    setStep("booking");
  };

  const handleRequestRide = async (
    rideType: string,
    offerAmount: number,
    payMethod: "cash" | "payshap",
  ) => {
    if (isGuest || !user?.id) {
      Alert.alert("Sign In Required", "Please sign in to book a ride.");
      return;
    }
    if (!destinationLatitude || !destinationLongitude || !destinationAddress) {
      Alert.alert("Missing Location", "Please select a valid destination.");
      return;
    }

    const distanceKm = routeDistance ? routeDistance / 1000 : 0;
    const durationMin = routeTime ? Math.round(routeTime / 60) : 0;

    setIsCreatingRide(true);
    try {
      const rides = await createRide({
        user_id: user.clerk_id ?? user.id,
        pickup_address: userAddress ?? "Current location",
        pickup_lat: userLatitude ?? 0,
        pickup_lng: userLongitude ?? 0,
        dropoff_address: destinationAddress,
        dropoff_lat: destinationLatitude,
        dropoff_lng: destinationLongitude,
        stops: useRideStore.getState().stops,
        capacity: useRideStore.getState().passengerCount,
        distance_km: distanceKm,
        duration_minutes: durationMin,
        ride_type: rideType,
        payment_method: payMethod,
        proposed_price: offerAmount > 0 ? offerAmount : undefined,
      });

      const rideId = rides?.[0]?.id;
      if (!rideId) throw new Error("Failed to create ride request");

      setCurrentRideId(rideId);
      setActiveRideId(rideId);
      setStep("searching");

      // Set timeout for searching
      matchTimeoutRef.current = setTimeout(() => {
        Alert.alert(
          "No Drivers Available",
          "We couldn't find a driver nearby. Keep searching?",
          [
            {
              text: "Keep Searching",
              onPress: () => {
                matchTimeoutRef.current = setTimeout(async () => {
                  await cancelRide(rideId, "system", "Match timeout");
                  resetRideFlow();
                }, MATCH_TIMEOUT_MS);
              },
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: async () => {
                await cancelRide(rideId, "user", "No drivers found");
                resetRideFlow();
              },
            },
          ],
        );
      }, MATCH_TIMEOUT_MS);
    } catch (err: any) {
      Alert.alert("Booking Failed", err.message ?? "Could not request ride.");
    } finally {
      setIsCreatingRide(false);
    }
  };

  const handleCancelSearch = async () => {
    if (activeRideId) {
      await cancelRide(activeRideId, "user", "User cancelled during search");
    }
    resetRideFlow();
    setStep("search");
  };

  const handleCancelRide = async () => {
    Alert.alert("Cancel Ride", "Are you sure you want to cancel this ride?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          if (activeRideId) {
            await cancelRide(
              activeRideId,
              "user",
              "User cancelled after match",
            );
          }
          resetRideFlow();
        },
      },
    ]);
  };

  const handleSignOut = async () => {
    const wasGuest = isGuest;
    if (activeRideId) {
      await cancelRide(activeRideId, "user", "User signed out");
    }
    await signOut();
    router.replace(wasGuest ? "/(auth)/welcome" : "/(auth)/sign-in");
  };

  const timeHint = getTimeBasedHint();
  const RootView = Platform.OS === "web" ? View : GestureHandlerRootView;

  return (
    <RootView style={{ flex: 1 }}>
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" />

        <View className="absolute top-0 left-0 right-0 bottom-0">
          <GoogleMap />
        </View>

        {step === "search" && (
          <SafeAreaView className="flex-1" edges={["top"]}>
            <View className="flex-row items-center justify-between px-5 pt-2 z-50">
              <TouchableOpacity
                onPress={() => setIsDrawerOpen(true)}
                className="w-12 h-12 rounded-full bg-neutral-900/90 border border-neutral-800 items-center justify-center"
              >
                <Ionicons name="menu" size={22} color="white" />
              </TouchableOpacity>

              <Text className="text-white text-lg font-JakartaExtraBold tracking-[5px]">
                VARLIFE
              </Text>

              <TouchableOpacity
                onPress={() => router.push("/(root)/(tabs)/profile")}
                className="w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden items-center justify-center"
              >
                {user?.profile_image_url ? (
                  <Image
                    source={{ uri: user.profile_image_url }}
                    className="w-full h-full"
                  />
                ) : (
                  <Ionicons name="person" size={20} color="#888" />
                )}
              </TouchableOpacity>
            </View>

            <BookingCard
              currentAddress={userAddress}
              onDestinationSelect={handleDestinationPress}
              userId={user?.clerk_id ?? user?.id}
            />

            {timeHint && (
              <View className="flex-row justify-start px-5 mt-4">
                <View className="flex-row items-center bg-[#1E1E1E] px-4 py-2.5 rounded-full border border-[#2A2A2A]">
                  <Ionicons
                    name={
                      timeHint === "Late night ride"
                        ? "moon-outline"
                        : "alarm-outline"
                    }
                    size={16}
                    color="white"
                  />
                  <Text className="text-white font-JakartaMedium text-xs ml-2">
                    {timeHint}
                  </Text>
                </View>
              </View>
            )}
          </SafeAreaView>
        )}

        {isDestinationSearchOpen && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "#0A0A0A",
              zIndex: 100,
            }}
          >
            <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
              <View className="flex-row items-center px-5 pt-4 mb-6">
                <TouchableOpacity
                  onPress={() => setIsDestinationSearchOpen(false)}
                  className="w-10 h-10 rounded-full bg-[#1A1A1A] items-center justify-center border border-[#2A2A2A]"
                  accessibilityRole="button"
                  accessibilityLabel="Close search"
                >
                  <Ionicons name="chevron-back" size={20} color="white" />
                </TouchableOpacity>
                <Text className="flex-1 text-center text-white text-lg font-JakartaExtraBold mr-10">
                  Find your ride
                </Text>
              </View>

              <View style={{ flex: 1, paddingHorizontal: 20 }}>
                <Text className="text-[#888] text-[10px] font-JakartaBold uppercase tracking-widest mb-2">
                  Pickup Location
                </Text>
                <View className="flex-row items-center bg-[#1A1A1A] rounded-2xl px-5 py-4 border border-[#2A2A2A] mb-4">
                  <Ionicons name="location-outline" size={18} color="#888" />
                  <Text
                    className="text-white font-JakartaMedium ml-3 flex-1"
                    numberOfLines={1}
                  >
                    {userAddress || "Current Location"}
                  </Text>
                </View>

                <Text className="text-[#888] text-[10px] font-JakartaBold uppercase tracking-widest mb-2">
                  Destination
                </Text>
                <GoogleTextInput
                  icon={icons.search}
                  initialLocation="Where are you going?"
                  containerStyle="mb-6 z-[100]"
                  textInputBackgroundColor="#1A1A1A"
                  handlePress={handleDestinationSelect}
                  userId={user?.clerk_id ?? user?.id}
                  inlinePredictions
                />
              </View>
            </SafeAreaView>
          </View>
        )}

        {step === "booking" && (
          <>
            <SafeAreaView
              className="absolute top-0 left-0 right-0 z-50 px-5 pt-4"
              edges={["top"]}
            >
              <TouchableOpacity
                onPress={() => {
                  setDestinationLocation({
                    latitude: null,
                    longitude: null,
                    address: null,
                  });
                  setStep("search");
                }}
                className="w-12 h-12 rounded-full bg-[#1A1A1A] items-center justify-center border border-[#2A2A2A] shadow-md"
                accessibilityRole="button"
                accessibilityLabel="Cancel and go back"
              >
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
            </SafeAreaView>
            <BookingBottomSheet
              ref={bottomSheetRef}
              onAddStop={() => {
                setSearchMode("stop");
                setIsDestinationSearchOpen(true);
              }}
              onRequestRide={handleRequestRide}
              isCreatingRide={isCreatingRide}
            />
          </>
        )}

        <VarlifeDrawer
          visible={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          userName={user?.first_name || user?.full_name || "Guest"}
          userEmail={user?.email}
          userAvatar={user?.profile_image_url}
          rating={4.98}
          rideCount={0}
          onSignOut={handleSignOut}
        />

        {step === "searching" && (
          <View className="absolute bottom-0 left-0 right-0 z-50">
            <DriverSearch onCancel={handleCancelSearch} />
          </View>
        )}

        {(step === "driver_assigned" || step === "in_trip") &&
          assignedDriver && (
            <View className="absolute bottom-0 left-0 right-0 z-50">
              <DriverCard
                driver={assignedDriver}
                onCancel={handleCancelRide}
                eta={step === "in_trip" ? "En route" : eta}
                vehiclePlate={vehiclePlate}
                rideId={activeRideId ?? undefined}
                status={step === "in_trip" ? "in_trip" : "arriving"}
              />
            </View>
          )}
      </View>
    </RootView>
  );
};

export default Home;
