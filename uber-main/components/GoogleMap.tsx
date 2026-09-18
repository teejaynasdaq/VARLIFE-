import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState, useRef } from "react";
import { View, Image, Dimensions, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import { icons } from "@/constants";
import { googleMaps } from "@/lib/googleMaps";
import { useLocationStore, useDriverStore } from "@/store";
import { useRideStore } from "@/store/rideStore";

const { width, height } = Dimensions.get("window");

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0d0d0d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6b6b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d0d0d" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1a1a1a" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2a2a2a" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#222" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const GoogleMap = () => {
  const {
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
    setRouteInfo,
  } = useLocationStore();
  const { drivers, selectedDriver } = useDriverStore();
  const { stops } = useRideStore();
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const mapRef = useRef<MapView>(null);

  const region = {
    latitude: userLatitude || -25.7479,
    longitude: userLongitude || 28.2293,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  };

  const fetchRoute = useCallback(async () => {
    if (
      userLatitude &&
      userLongitude &&
      destinationLatitude &&
      destinationLongitude
    ) {
      const route = await googleMaps.getRoute(
        userLatitude,
        userLongitude,
        destinationLatitude,
        destinationLongitude,
        stops.map((s) => ({ latitude: s.latitude, longitude: s.longitude })),
      );
      if (route) {
        setRouteCoords(route.coords);
        setRouteInfo({
          distance: route.distanceKm * 1000,
          time: route.durationMin * 60,
        });
      }
    } else {
      setRouteCoords([]);
    }
  }, [
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
    setRouteInfo,
    stops,
  ]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  return (
    <View style={{ width, height }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ width, height }}
        region={region}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        rotateEnabled
        pitchEnabled
      >
        {userLatitude && userLongitude && destinationLatitude && (
          <Marker
            coordinate={{ latitude: userLatitude, longitude: userLongitude }}
            title="Your location"
          >
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: "#FFF",
                borderWidth: 3,
                borderColor: "#333",
              }}
            />
          </Marker>
        )}

        {destinationLatitude && destinationLongitude && (
          <Marker
            coordinate={{
              latitude: destinationLatitude,
              longitude: destinationLongitude,
            }}
            title="Destination"
          >
            <Image
              source={icons.pin}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
          </Marker>
        )}

        {stops.map((stop: any, index: number) => (
          <Marker
            key={`stop-${index}`}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={`Stop ${index + 1}`}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: "#FFF",
                borderWidth: 2,
                borderColor: "#666",
              }}
            />
          </Marker>
        ))}

        {routeCoords.length > 0 && (
          <>
            <Polyline
              coordinates={routeCoords}
              strokeWidth={8}
              strokeColor="rgba(255, 255, 255, 0.15)"
              lineCap="round"
              lineJoin="round"
            />
            <Polyline
              coordinates={routeCoords}
              strokeWidth={4}
              strokeColor="#F2F2F2"
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}

        {drivers.map((driver) => {
          const isSelected = driver.id === selectedDriver;
          return (
            <Marker
              key={driver.id}
              coordinate={{
                latitude: driver.latitude,
                longitude: driver.longitude,
              }}
              style={{
                transform: [{ rotate: `${driver.heading || 0}deg` }],
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 48,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 6,
                  elevation: 8,
                  borderWidth: isSelected ? 2 : 1.5,
                  borderColor: isSelected ? "#0286FF" : "rgba(255,255,255,0.1)",
                  backgroundColor: "#000",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    left: 1,
                    right: 1,
                    height: 6,
                    backgroundColor: "rgba(0,0,0,0.8)",
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }}
                />
                <View
                  style={{
                    width: 16,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: "#1A1A1A",
                    position: "relative",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: -3,
                    left: 2,
                    right: 2,
                    height: 4,
                    backgroundColor: "rgba(0,0,0,0.8)",
                    borderBottomLeftRadius: 3,
                    borderBottomRightRadius: 3,
                  }}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <TouchableOpacity
        className="absolute bottom-28 right-5 w-14 h-14 bg-[#1E1E1E] rounded-full items-center justify-center border border-[#2A2A2A] shadow-lg z-50"
        onPress={() => {
          if (userLatitude && userLongitude) {
            mapRef.current?.animateToRegion(
              {
                latitude: userLatitude,
                longitude: userLongitude,
                latitudeDelta: 0.012,
                longitudeDelta: 0.012,
              },
              1000,
            );
          }
        }}
      >
        <Ionicons name="locate-sharp" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default GoogleMap;
