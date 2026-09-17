import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";

interface Ride {
  id: string;
  status: string;
  pickup_address: string;
  destination_address: string;
  price: number;
  rider_rating?: number;
  pickup_distance_text?: string;
  trip_duration_text?: string;
  trip_distance_text?: string;
}

interface RideRequestModalProps {
  isVisible: boolean;
  ride: Ride | null;
  onAccept: (rideId: string) => void;
  onClose: () => void;
}

const RideRequestModal = ({
  isVisible,
  ride,
  onAccept,
  onClose,
}: RideRequestModalProps) => {
  if (!isVisible || !ride) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header Tags & Close */}
        <View style={styles.header}>
          <View style={styles.tagsContainer}>
            <View style={[styles.tag, styles.rideTypeTag]}>
              <Ionicons name="person" size={14} color="white" />
              <Text style={styles.rideTypeText}>UberX</Text>
            </View>
            <View style={[styles.tag, styles.exclusiveTag]}>
              <Text style={styles.exclusiveText}>Exclusive</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* Price and Rating */}
        <View style={styles.priceRatingContainer}>
          <Text style={styles.price}>
            ₦{new Intl.NumberFormat("en-NG").format(ride.price)}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="black" />
            <Text style={styles.ratingText}>{ride.rider_rating || "4.85"}</Text>
          </View>
        </View>

        {/* Location Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.timelineContainer}>
            <View style={styles.dot} />
            <View style={styles.line} />
            <View style={styles.square} />
          </View>
          <View style={styles.locationsContainer}>
            <View style={styles.locationItem}>
              <Text style={styles.locationTitle}>
                {ride.pickup_distance_text || "1 min"} away
              </Text>
              <Text style={styles.address}>{ride.pickup_address}</Text>
            </View>
            <View style={[styles.locationItem, { marginTop: 15 }]}>
              <Text style={styles.locationTitle}>
                {ride.trip_duration_text || "46 mins"} trip (
                {ride.trip_distance_text})
              </Text>
              <Text style={styles.address}>{ride.destination_address}</Text>
            </View>
          </View>
        </View>

        {/* Accept Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onAccept(ride.id)}
          style={styles.acceptButton}
        >
          <View style={styles.buttonTimerBackground} />
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 40,
    left: 15,
    right: 15,
    zIndex: 1000,
  },
  container: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  rideTypeTag: {
    backgroundColor: "black",
  },
  rideTypeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 6,
  },
  exclusiveTag: {
    backgroundColor: "#F0F5FF",
  },
  exclusiveText: {
    color: "#3B71F3",
    fontWeight: "600",
    fontSize: 15,
  },
  closeButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  priceRatingContainer: {
    marginBottom: 20,
  },
  price: {
    fontSize: 44,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: -1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    fontSize: 17,
    fontWeight: "500",
    marginLeft: 6,
    color: "#333",
  },
  detailsContainer: {
    flexDirection: "row",
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  timelineContainer: {
    width: 20,
    alignItems: "center",
    marginRight: 15,
    paddingVertical: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "black",
  },
  line: {
    width: 1,
    flex: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 5,
  },
  square: {
    width: 7,
    height: 7,
    backgroundColor: "black",
  },
  locationsContainer: {
    flex: 1,
  },
  locationItem: {
    justifyContent: "center",
  },
  locationTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
    lineHeight: 22,
  },
  address: {
    fontSize: 15,
    color: "#666",
    marginTop: 2,
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: "#3B71F3",
    height: 64,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  buttonTimerBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "40%",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  acceptButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default RideRequestModal;
