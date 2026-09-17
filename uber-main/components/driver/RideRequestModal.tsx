import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";

interface Ride {
  id: string;
  status: string;
  pickup_address: string;
  destination_address: string;
  price: number;
  proposed_price?: number;
  negotiated_price?: number;
  rider_rating?: number;
  pickup_distance_text?: string;
  trip_duration_text?: string;
  trip_distance_text?: string;
}

interface RideRequestModalProps {
  isVisible: boolean;
  ride: Ride | null;
  onAccept: (rideId: string) => void;
  onDecline: (rideId: string) => void;
  onNegotiate?: (rideId: string, counterPrice: number) => void;
  onClose: () => void;
}

const RideRequestModal = ({
  isVisible,
  ride,
  onAccept,
  onDecline,
  onNegotiate,
  onClose,
}: RideRequestModalProps) => {
  const [showNegotiateInput, setShowNegotiateInput] = useState(false);
  const [counterInput, setCounterInput] = useState("");

  if (!isVisible || !ride) return null;

  const displayPrice =
    ride.negotiated_price ?? ride.proposed_price ?? ride.price;

  const handleNegotiatePress = () => {
    if (!showNegotiateInput) {
      // Pre-fill with the current ride price + 10% suggestion
      setCounterInput(String(Math.round(displayPrice * 1.1)));
      setShowNegotiateInput(true);
    } else {
      const parsed = parseFloat(counterInput);
      if (!parsed || parsed <= 0) {
        Alert.alert("Invalid Amount", "Please enter a valid counter price.");
        return;
      }
      onNegotiate?.(ride.id, parsed);
      setShowNegotiateInput(false);
      setCounterInput("");
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.tagsContainer}>
            <View style={[styles.tag, styles.rideTypeTag]}>
              <Ionicons name="person" size={14} color="white" />
              <Text style={styles.rideTypeText}>VarLife X</Text>
            </View>
            <View style={[styles.tag, styles.newTag]}>
              <Text style={styles.newTagText}>NEW REQUEST</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="black" />
          </TouchableOpacity>
        </View>

        {/* Price and Rating */}
        <View style={styles.priceRatingContainer}>
          <Text style={styles.price}>
            R{new Intl.NumberFormat("en-ZA").format(displayPrice)}
          </Text>
          {ride.negotiated_price && (
            <View style={styles.negotiatedBadge}>
              <Ionicons name="chatbubble-ellipses" size={12} color="#2E64E3" />
              <Text style={styles.negotiatedText}>Negotiated offer</Text>
            </View>
          )}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFB800" />
            <Text style={styles.ratingText}>
              {ride.rider_rating?.toFixed(2) || "4.85"} rider rating
            </Text>
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
                {ride.pickup_distance_text || "2 min"} away
              </Text>
              <Text style={styles.address} numberOfLines={2}>
                {ride.pickup_address}
              </Text>
            </View>
            <View style={[styles.locationItem, { marginTop: 16 }]}>
              <Text style={styles.locationTitle}>
                {ride.trip_duration_text || "25 min"} trip{" "}
                {ride.trip_distance_text ? `• ${ride.trip_distance_text}` : ""}
              </Text>
              <Text style={styles.address} numberOfLines={2}>
                {ride.destination_address}
              </Text>
            </View>
          </View>
        </View>

        {/* Negotiate Input */}
        {showNegotiateInput && (
          <View style={styles.negotiateInputContainer}>
            <Text style={styles.negotiateInputLabel}>
              Your Counter Offer (R)
            </Text>
            <View style={styles.negotiateInputRow}>
              <Text style={styles.currencySymbol}>R</Text>
              <TextInput
                style={styles.negotiateInput}
                value={counterInput}
                onChangeText={setCounterInput}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor="#999"
                autoFocus
              />
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onDecline(ride.id)}
            style={styles.declineButton}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onAccept(ride.id)}
            style={styles.acceptButton}
          >
            <Ionicons
              name="checkmark"
              size={20}
              color="white"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>

        {/* Negotiate option */}
        {onNegotiate && (
          <TouchableOpacity
            style={[
              styles.negotiateButton,
              showNegotiateInput && styles.negotiateButtonActive,
            ]}
            onPress={handleNegotiatePress}
          >
            <Ionicons
              name={showNegotiateInput ? "send" : "chatbubble-ellipses-outline"}
              size={16}
              color={showNegotiateInput ? "#fff" : "#2E64E3"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.negotiateText,
                showNegotiateInput && { color: "#fff" },
              ]}
            >
              {showNegotiateInput
                ? `Send Offer: R${new Intl.NumberFormat("en-ZA").format(parseFloat(counterInput) || 0)}`
                : `Negotiate Price (suggested R${new Intl.NumberFormat("en-ZA").format(Math.round(displayPrice * 1.1))})`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 30,
    left: 12,
    right: 12,
    zIndex: 1000,
  },
  container: {
    backgroundColor: "#121212",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  rideTypeTag: {
    backgroundColor: "#333",
  },
  rideTypeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 5,
  },
  newTag: {
    backgroundColor: "#1C3A6E", // dark blue
  },
  newTagText: {
    color: "#5B8DEF", // light blue
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  closeButton: {
    backgroundColor: "#222",
    borderRadius: 10,
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  priceRatingContainer: {
    marginBottom: 18,
  },
  price: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FFF",
    letterSpacing: -1,
  },
  negotiatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 4,
  },
  negotiatedText: {
    fontSize: 12,
    color: "#60A5FA", // blue
    fontWeight: "600",
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 5,
    color: "#AAA",
  },
  detailsContainer: {
    flexDirection: "row",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  timelineContainer: {
    width: 18,
    alignItems: "center",
    marginRight: 14,
    paddingVertical: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  line: {
    width: 1.5,
    flex: 1,
    backgroundColor: "#333",
    marginVertical: 4,
  },
  square: {
    width: 8,
    height: 8,
    backgroundColor: "#FFF",
    borderRadius: 2,
  },
  locationsContainer: {
    flex: 1,
  },
  locationItem: {
    justifyContent: "center",
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  address: {
    fontSize: 15,
    color: "#EEE",
    lineHeight: 20,
    fontWeight: "500",
  },
  negotiateInputContainer: {
    marginBottom: 14,
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#333",
  },
  negotiateInputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#60A5FA",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  negotiateInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    marginRight: 4,
  },
  negotiateInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    padding: 0,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  declineButton: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.14)",
  },
  declineButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
  acceptButton: {
    flex: 2,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(28,110,242,0.22)",
    borderWidth: 1.3,
    borderColor: "rgba(28,110,242,0.55)",
    flexDirection: "row",
    shadowColor: "#1C6EF2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 5,
  },
  acceptButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
  },
  negotiateButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "rgba(59,130,246,0.5)",
    backgroundColor: "rgba(59,130,246,0.1)",
  },
  negotiateButtonActive: {
    backgroundColor: "rgba(59,130,246,0.35)",
    borderColor: "rgba(59,130,246,0.8)",
  },
  negotiateText: {
    color: "#60A5FA",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default RideRequestModal;
