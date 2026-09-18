import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Polyline,
  LatLng,
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import RideRequestModal from "@/components/driver/RideRequestModal";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { canDriverGoOnline, subscribeToDriverVerification } from "@/lib/veriff";

interface Ride {
  id: string;
  status: string;
  pickup_address: string;
  destination_address: string;
  pickup_lat: number;
  pickup_lng: number;
  destination_lat: number;
  destination_lng: number;
  price: number;
  proposed_price?: number;
  negotiated_price?: number;
  rider_rating?: number;
  pickup_distance_text?: string;
  trip_duration_text?: string;
  trip_distance_text?: string;
  user_id: string;
}

interface ActiveTrip {
  id: string;
  status: string;
  pickup_address: string;
  destination_address: string;
  pickup_lat: number;
  pickup_lng: number;
  destination_lat: number;
  destination_lng: number;
  price: number;
  user_id: string;
}

const { height } = Dimensions.get("window");
const GOOGLE_MAPS_APIKEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY ||
  process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

const MAP_STYLE = [
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  {
    featureType: "poi.park",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Polyline decoder utility
// ─────────────────────────────────────────────────────────────────────────────
function decodePolyline(encoded: string): LatLng[] {
  let index = 0;
  const result: LatLng[] = [];
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b,
      shift = 0,
      r = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      r |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += r & 1 ? ~(r >> 1) : r >> 1;
    shift = 0;
    r = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      r |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += r & 1 ? ~(r >> 1) : r >> 1;
    result.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen Component
// ─────────────────────────────────────────────────────────────────────────────
export default function DriverHomeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Location
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [heading, setHeading] = useState<number>(0);

  const [isVerified, setIsVerified] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);

  // Ride request
  const [showRideRequest, setShowRideRequest] = useState(false);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [seenRideIds, setSeenRideIds] = useState<Set<string>>(new Set());

  // Active trip (accepted / started)
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);

  // Keep latest `user` available inside the location-watch callback below,
  // which is set up once on mount — without this, the callback would keep
  // reading the `user` value (often still null, since auth state resolves
  // asynchronously) captured at that first render, and driver location
  // updates would silently never be written to the database.
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const snapPoints = useMemo(
    () =>
      activeTrip ? ["20%", "55%"] : isOnline ? ["15%", "45%", "88%"] : ["15%"],
    [isOnline, activeTrip],
  );

  // ── Location tracking ────────────────────────────────────────────────────
  useEffect(() => {
    let locSub: Location.LocationSubscription | null = null;
    let hdgSub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      locSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (newLoc) => {
          setLocation(newLoc);
          if (userRef.current) {
            supabase
              .from("drivers")
              .update({
                current_lat: newLoc.coords.latitude,
                current_lng: newLoc.coords.longitude,
                updated_at: new Date().toISOString(),
              })
              .eq("id", userRef.current.id)
              .then(() => {});
          }
        },
      );

      hdgSub = await Location.watchHeadingAsync((h) =>
        setHeading(h.trueHeading),
      );
    })();

    return () => {
      locSub?.remove();
      hdgSub?.remove();
    };
  }, []);

  // ── Fetch route polyline ─────────────────────────────────────────────────
  const fetchRoute = useCallback(
    async (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
      if (!GOOGLE_MAPS_APIKEY) return;
      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&key=${GOOGLE_MAPS_APIKEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === "OK" && data.routes.length > 0) {
          setRouteCoords(
            decodePolyline(data.routes[0].overview_polyline.points),
          );
        }
      } catch (e) {
        console.warn("[Driver] fetchRoute error:", e);
      }
    },
    [],
  );

  // ── Fetch driver data on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    (async () => {
      const { data: driverRow } = await supabase
        .from("drivers")
        .select(
          "is_online, total_trips, total_rides, rating, is_verified, verification_status",
        )
        .eq("id", user.id)
        .maybeSingle();

      const driver = driverRow as {
        is_online: boolean;
        total_trips: number | null;
        total_rides: number | null;
        rating: number | null;
        is_verified: boolean;
        verification_status: string;
      } | null;

      if (driver) {
        const verified = canDriverGoOnline(driver as any);
        setIsVerified(verified);
        if (!verified) {
          router.replace("/(driver)/driver-verification" as Href);
          return;
        }
        setIsOnline(driver.is_online ?? false);
        setTotalTrips(driver.total_trips ?? 0);
      }

      // Today's earnings
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: completed } = await supabase
        .from("rides")
        .select("final_price, driver_payout")
        .eq("driver_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", todayStart.toISOString());

      if (completed) {
        const sum = completed.reduce(
          (acc: number, t: any) =>
            acc + (t.driver_payout ?? t.final_price ?? 0),
          0,
        );
        setTodayEarnings(sum);
      }

      // Check for an existing active trip
      const { data: trip } = await supabase
        .from("rides")
        .select("*")
        .eq("driver_id", user.id)
        .in("status", ["accepted", "started"])
        .maybeSingle();

      if (trip) {
        setActiveTrip({
          ...trip,
          destination_address: trip.dropoff_address,
          destination_lat: trip.dropoff_lat,
          destination_lng: trip.dropoff_lng,
          price: trip.final_price ?? trip.driver_payout ?? 0,
        } as ActiveTrip);
        fetchRoute(
          trip.pickup_lat,
          trip.pickup_lng,
          trip.dropoff_lat,
          trip.dropoff_lng,
        );
      }
    })();
  }, [user, router, fetchRoute]);

  // ── Realtime verification guard ──────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    return subscribeToDriverVerification(user.id, (updated) => {
      const verified = canDriverGoOnline(updated);
      setIsVerified(verified);
      if (!verified && isOnline) {
        setIsOnline(false);
        supabase
          .from("drivers")
          .update({ is_online: false, updated_at: new Date().toISOString() })
          .eq("id", user.id);
      }
      if (!verified) {
        router.replace("/(driver)/driver-verification" as Href);
      }
    });
  }, [user?.id, isOnline, router]);

  // ── Toggle Online / Offline ──────────────────────────────────────────────
  const toggleOnline = useCallback(async () => {
    if (isUpdatingStatus || !user || !location) return;
    if (!isVerified) {
      Alert.alert(
        "Verification Required",
        "Your driver licence must be verified before you can go online.",
        [
          {
            text: "Check Status",
            onPress: () => router.push("/(driver)/driver-verification" as Href),
          },
        ],
      );
      return;
    }
    setIsUpdatingStatus(true);
    const nextState = !isOnline;
    try {
      if (nextState) {
        const { error } = await supabase
          .from("drivers")
          .update({
            current_lat: location.coords.latitude,
            current_lng: location.coords.longitude,
            is_online: true,
            online_since: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
        if (error) throw error;
      } else {
        await supabase
          .from("drivers")
          .update({ is_online: false, updated_at: new Date().toISOString() })
          .eq("id", user.id);
        bottomSheetRef.current?.snapToIndex(0);
      }
      setIsOnline(nextState);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [isUpdatingStatus, user, location, isOnline, isVerified, router]);

  // ── Fetch nearby ride requests ───────────────────────────────────────────
  const fetchNearbyRides = useCallback(async () => {
    if (!isOnline || !location || showRideRequest || activeTrip) return;
    try {
      const { data: rides, error } = await supabase
        .from("rides")
        .select("*, users(first_name, last_name, rating)")
        .eq("status", "requested")
        .is("driver_id", null)
        .order("requested_at", { ascending: true });

      if (error || !rides?.length) return;

      const driverCoords = `${location.coords.latitude},${location.coords.longitude}`;

      for (const ride of rides) {
        if (seenRideIds.has(ride.id)) continue;

        const pickupLat = ride.pickup_lat;
        const pickupLng = ride.pickup_lng;
        const destLat = ride.dropoff_lat;
        const destLng = ride.dropoff_lng;

        if (!pickupLat || !pickupLng) continue;

        const ridePickup = `${pickupLat},${pickupLng}`;
        const rideDest = `${destLat},${destLng}`;
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${driverCoords}|${ridePickup}&destinations=${ridePickup}|${rideDest}&key=${GOOGLE_MAPS_APIKEY}`;

        try {
          const res = await fetch(url);
          const dist = await res.json();
          if (dist.status !== "OK") continue;

          const driverToPickup = dist.rows[0].elements[0];
          const tripMeta = dist.rows[1].elements[1];

          if (
            driverToPickup.status === "OK" &&
            driverToPickup.distance.value / 1000 <= 10
          ) {
            const enriched: Ride = {
              id: ride.id,
              status: ride.status,
              pickup_address: ride.pickup_address ?? "Unknown pickup",
              destination_address:
                ride.dropoff_address ?? "Unknown destination",
              pickup_lat: pickupLat,
              pickup_lng: pickupLng,
              destination_lat: destLat,
              destination_lng: destLng,
              price: ride.final_price ?? 0,
              user_id: ride.rider_id,
              pickup_distance_text: driverToPickup.duration?.text ?? "2 min",
              trip_duration_text: tripMeta?.duration?.text ?? "—",
              trip_distance_text: tripMeta?.distance?.text ?? "—",
              rider_rating: ride.users?.rating ?? 4.85,
            };

            setCurrentRide(enriched);
            setShowRideRequest(true);
            setSeenRideIds((prev) => new Set([...prev, ride.id]));
            break;
          }
        } catch (e) {
          console.warn("[Driver] distance matrix error:", e);
        }
      }
    } catch (err) {
      console.warn("[Driver] fetchNearbyRides:", err);
    }
  }, [isOnline, location, showRideRequest, activeTrip, seenRideIds]);

  // ── Realtime subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOnline || !user) return;

    fetchNearbyRides();

    const channel = supabase
      .channel(`driver_rides_${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rides" },
        (payload) => {
          const r = payload.new as any;
          if (r.status === "requested" && !r.driver_id) fetchNearbyRides();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides" },
        (payload) => {
          const r = payload.new as any;
          if (r.driver_id === user.id && r.status === "completed") {
            setActiveTrip(null);
            setRouteCoords([]);
            setTotalTrips((p) => p + 1);
            setTodayEarnings(
              (p) => p + (r.driver_payout ?? r.final_price ?? 0),
            );
            Alert.alert(
              "🎉 Trip Complete!",
              `You earned R${new Intl.NumberFormat("en-ZA").format(r.negotiated_price ?? r.price)}`,
            );
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isOnline, user?.id, fetchNearbyRides]);

  // Polling fallback every 15 s
  useEffect(() => {
    if (!isOnline) return;
    const id = setInterval(fetchNearbyRides, 15000);
    return () => clearInterval(id);
  }, [isOnline, fetchNearbyRides]);

  // ── Accept ───────────────────────────────────────────────────────────────
  const handleAcceptRide = useCallback(
    async (rideId: string) => {
      if (!user || !currentRide || !isVerified) {
        Alert.alert(
          "Verification Required",
          "Complete licence verification to accept rides.",
        );
        return;
      }
      try {
        const { data, error } = await supabase
          .from("rides")
          .update({
            status: "accepted",
            driver_id: user.id,
            accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", rideId)
          .eq("status", "requested") // optimistic lock
          .select();

        if (error || !data?.length) {
          Alert.alert("Ride Taken", "Another driver accepted this ride first.");
          setShowRideRequest(false);
          setCurrentRide(null);
          return;
        }

        setShowRideRequest(false);
        setActiveTrip({
          id: currentRide.id,
          status: "accepted",
          pickup_address: currentRide.pickup_address,
          destination_address: currentRide.destination_address,
          pickup_lat: currentRide.pickup_lat,
          pickup_lng: currentRide.pickup_lng,
          destination_lat: currentRide.destination_lat,
          destination_lng: currentRide.destination_lng,
          price: currentRide.price,
          user_id: currentRide.user_id,
        });
        setCurrentRide(null);

        fetchRoute(
          currentRide.pickup_lat,
          currentRide.pickup_lng,
          currentRide.destination_lat,
          currentRide.destination_lng,
        );

        mapRef.current?.animateToRegion(
          {
            latitude: currentRide.pickup_lat,
            longitude: currentRide.pickup_lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          800,
        );
      } catch (err: any) {
        Alert.alert("Error", err.message ?? "Failed to accept ride");
      }
    },
    [user, currentRide, fetchRoute, isVerified],
  );

  // ── Decline ──────────────────────────────────────────────────────────────
  const handleDeclineRide = useCallback((rideId: string) => {
    setShowRideRequest(false);
    setCurrentRide(null);
    setSeenRideIds((prev) => new Set([...prev, rideId]));
  }, []);

  // ── Negotiate ────────────────────────────────────────────────────────────
  const handleNegotiateRide = useCallback(
    async (rideId: string, counterPrice: number) => {
      if (!user) return;
      try {
        await supabase
          .from("rides")
          .update({
            final_price: counterPrice,
            driver_payout: counterPrice * 0.85,
            status: "requested",
            driver_id: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", rideId);

        setShowRideRequest(false);
        setCurrentRide(null);
        Alert.alert(
          "Counter Offer Sent 💬",
          `Your counter offer of R${new Intl.NumberFormat("en-ZA").format(counterPrice)} has been sent to the rider.`,
        );
      } catch {
        Alert.alert("Error", "Failed to send counter offer. Please try again.");
      }
    },
    [user],
  );

  // ── Trip status (Start / Complete) ───────────────────────────────────────
  const updateTripStatus = useCallback(
    async (newStatus: "accepted" | "started" | "completed") => {
      if (!activeTrip) return;
      try {
        const extra: any = {
          updated_at: new Date().toISOString(),
          status: newStatus,
        };
        if (newStatus === "started")
          extra.started_at = new Date().toISOString();
        if (newStatus === "completed") {
          extra.completed_at = new Date().toISOString();
          extra.payment_status = "paid";
        }

        await supabase.from("rides").update(extra).eq("id", activeTrip.id);

        if (newStatus === "completed") {
          setActiveTrip(null);
          setRouteCoords([]);
          setTotalTrips((p) => p + 1);
          setTodayEarnings((p) => p + (activeTrip.price ?? 0));
          Alert.alert(
            "🎉 Trip Complete!",
            `You earned R${new Intl.NumberFormat("en-ZA").format(activeTrip.price ?? 0)}`,
          );
        } else {
          setActiveTrip({ ...activeTrip, status: newStatus });
        }
      } catch (err: any) {
        Alert.alert("Error", err.message);
      }
    },
    [activeTrip],
  );

  const centerOnUser = useCallback(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        },
        800,
      );
    }
  }, [location]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Full-screen Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={MAP_STYLE}
        initialRegion={{
          latitude: location?.coords.latitude ?? -26.2041,
          longitude: location?.coords.longitude ?? 28.0473,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        rotateEnabled
        pitchEnabled
      >
        {/* Driver arrow */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            flat
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={[
                styles.driverArrow,
                { transform: [{ rotate: `${heading}deg` }] },
              ]}
            >
              <View style={styles.driverArrowInner}>
                <MaterialCommunityIcons
                  name="navigation"
                  size={18}
                  color="black"
                />
              </View>
            </View>
          </Marker>
        )}

        {/* Active-trip pickup marker */}
        {activeTrip && (
          <Marker
            coordinate={{
              latitude: activeTrip.pickup_lat,
              longitude: activeTrip.pickup_lng,
            }}
            title="Pickup"
            pinColor="#1C6EF2"
          />
        )}

        {/* Active-trip destination marker */}
        {activeTrip && (
          <Marker
            coordinate={{
              latitude: activeTrip.destination_lat,
              longitude: activeTrip.destination_lng,
            }}
            title="Destination"
            pinColor="#1C6EF2"
          />
        )}

        {/* Route polyline */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="#1C6EF2"
          />
        )}
      </MapView>

      {/* ── Top Header ── */}
      <View style={[styles.header, { top: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => router.push("/(driver)/driver-account")}
        >
          <Ionicons name="menu" size={22} color="black" />
          <View
            style={[
              styles.onlineDot,
              { backgroundColor: isOnline ? "#1C6EF2" : "#CCC" },
            ]}
          />
        </TouchableOpacity>

        <View style={styles.earningsPill}>
          <Text style={styles.earningsLabel}>Today</Text>
          <Text style={styles.earningsText}>
            <Text style={{ color: "#1C6EF2" }}>R</Text>
            {new Intl.NumberFormat("en-ZA").format(todayEarnings)}
          </Text>
        </View>

        <TouchableOpacity style={styles.circleButton} onPress={centerOnUser}>
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={22}
            color="black"
          />
        </TouchableOpacity>
      </View>

      {/* ── GO button (offline only) ── */}
      {!isOnline && !activeTrip && (
        <TouchableOpacity
          style={[styles.goButtonWrap, { bottom: height * 0.2 }]}
          onPress={toggleOnline}
          disabled={isUpdatingStatus}
        >
          <View style={styles.goButtonOuter}>
            <View style={styles.goButtonInner}>
              {isUpdatingStatus ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.goText}>GO</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Bottom Sheet ── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={{ backgroundColor: "#CCC", width: 40 }}
        style={{ zIndex: 100 }}
        enableContentPanningGesture={isOnline || !!activeTrip}
        enableHandlePanningGesture={isOnline || !!activeTrip}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          {/* ── Active Trip Panel ── */}
          {activeTrip ? (
            <View>
              <View style={styles.sheetHeaderRow}>
                <View style={styles.activeBadge}>
                  <View style={styles.greenDot} />
                  <Text style={styles.activeBadgeText}>
                    {activeTrip.status === "accepted"
                      ? "Heading to Pickup"
                      : "Trip in Progress"}
                  </Text>
                </View>
              </View>

              <View style={styles.tripCard}>
                {/* Pickup */}
                <View style={styles.tripRow}>
                  <View style={styles.blueDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tripRowLabel}>PICKUP</Text>
                    <Text style={styles.tripRowAddr} numberOfLines={2}>
                      {activeTrip.pickup_address}
                    </Text>
                  </View>
                </View>
                <View style={styles.tripConnector} />
                {/* Destination */}
                <View style={styles.tripRow}>
                  <View style={styles.blackSquare} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tripRowLabel}>DROP-OFF</Text>
                    <Text style={styles.tripRowAddr} numberOfLines={2}>
                      {activeTrip.destination_address}
                    </Text>
                  </View>
                </View>
                {/* Fare */}
                <View style={styles.fareRow}>
                  <Text style={styles.fareAmount}>
                    R{new Intl.NumberFormat("en-ZA").format(activeTrip.price)}
                  </Text>
                  <Text style={styles.fareLabel}>Trip Fare</Text>
                </View>
              </View>

              {activeTrip.status === "accepted" && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => updateTripStatus("started")}
                >
                  <Ionicons
                    name="play-circle"
                    size={22}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.actionBtnText}>Start Trip</Text>
                </TouchableOpacity>
              )}

              {activeTrip.status === "started" && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#1C6EF2" }]}
                  onPress={() =>
                    Alert.alert(
                      "Complete Trip?",
                      "Confirm you have arrived at the destination.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Complete",
                          onPress: () => updateTripStatus("completed"),
                        },
                      ],
                    )
                  }
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.actionBtnText}>Complete Trip</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* ── Online / Offline Status Panel ── */
            <View>
              <View style={styles.sheetHeaderRow}>
                <TouchableOpacity>
                  <MaterialCommunityIcons name="tune" size={26} color="black" />
                </TouchableOpacity>
                <Text style={styles.statusTitle}>
                  {isOnline ? "You're online" : "You're offline"}
                </Text>
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.tripCount}>{totalTrips}</Text>
                  <Text style={styles.tripCountLabel}>trips</Text>
                </View>
              </View>

              <View style={styles.sheetDivider} />

              <Text style={styles.statusSub}>
                {isOnline
                  ? "Searching for nearby ride requests. Stay active to receive trips."
                  : "Tap GO to go online and start receiving ride requests."}
              </Text>

              {isOnline && (
                <>
                  <TouchableOpacity
                    style={styles.offlineBtn}
                    onPress={toggleOnline}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.offlineBtnText}>GO OFFLINE</Text>
                    )}
                  </TouchableOpacity>

                  {/* Earnings summary */}
                  <View style={styles.statsCard}>
                    <Text style={styles.statsCardTitle}>Today's Summary</Text>
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statVal}>
                          R
                          {new Intl.NumberFormat("en-ZA").format(todayEarnings)}
                        </Text>
                        <Text style={styles.statLbl}>Earnings</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text style={styles.statVal}>{totalTrips}</Text>
                        <Text style={styles.statLbl}>Total Trips</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text style={styles.statVal}>4.9 ★</Text>
                        <Text style={styles.statLbl}>Rating</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* ── Ride Request Modal ── */}
      <RideRequestModal
        isVisible={showRideRequest}
        ride={currentRide}
        onAccept={handleAcceptRide}
        onDecline={handleDeclineRide}
        onNegotiate={handleNegotiateRide}
        onClose={() => {
          setShowRideRequest(false);
          setCurrentRide(null);
        }}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  map: { ...StyleSheet.absoluteFillObject },

  // Header
  header: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#333",
  },
  onlineDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#1E1E1E",
  },
  earningsPill: {
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  earningsLabel: {
    color: "#888",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  earningsText: { color: "white", fontSize: 20, fontWeight: "800" },

  // Driver marker
  driverArrow: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  driverArrowInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#1C6EF2",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // GO button
  goButtonWrap: { position: "absolute", alignSelf: "center", zIndex: 5 },
  goButtonOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(28,110,242,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  goButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#1C6EF2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(0,0,0,0.4)",
  },
  goText: { color: "white", fontSize: 22, fontWeight: "bold" },

  // Bottom sheet
  sheetBg: {
    backgroundColor: "#000",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#171717",
  },
  sheetContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFF",
    flex: 1,
    textAlign: "center",
  },
  tripCount: { fontSize: 16, fontWeight: "800", color: "#FFF" },
  tripCountLabel: { fontSize: 10, color: "#999", textTransform: "uppercase" },
  sheetDivider: { height: 1, backgroundColor: "#222", marginBottom: 14 },
  statusSub: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  offlineBtn: {
    backgroundColor: "#FF3B30",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  offlineBtnText: { color: "white", fontSize: 16, fontWeight: "bold" },
  statsCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#333",
  },
  statsCardTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#AAA",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 18, fontWeight: "800", color: "#FFF" },
  statLbl: { fontSize: 11, color: "#888", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#333" },

  // Active trip
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C3A6E",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1C6EF2",
    marginRight: 6,
  },
  activeBadgeText: { fontSize: 13, fontWeight: "700", color: "#5B8DEF" },
  tripCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 18,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  tripRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  tripConnector: {
    width: 1.5,
    height: 20,
    backgroundColor: "#444",
    marginLeft: 4,
    marginBottom: 4,
  },
  blueDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
    marginTop: 4,
    marginRight: 12,
  },
  blackSquare: {
    width: 10,
    height: 10,
    backgroundColor: "#FFF",
    borderRadius: 2,
    marginTop: 4,
    marginRight: 12,
  },
  tripRowLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tripRowAddr: {
    fontSize: 14,
    color: "#EEE",
    fontWeight: "600",
    lineHeight: 20,
  },
  fareRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  fareAmount: { fontSize: 28, fontWeight: "800", color: "#FFF" },
  fareLabel: { fontSize: 13, color: "#999", marginLeft: 8 },
  actionBtn: {
    backgroundColor: "#1C6EF2",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  actionBtnText: { color: "white", fontSize: 17, fontWeight: "bold" },
});
