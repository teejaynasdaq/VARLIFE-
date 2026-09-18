import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface DriverProfile {
  vehicle_model?: string;
  vehicle_plate?: string;
  rating?: number;
  total_trips?: number;
  total_rides?: number;
  is_online?: boolean;
  full_name?: string;
  phone?: string;
  email?: string;
  total_earnings?: number;
}

interface VehicleDetails {
  car_model?: string;
  number_plate?: string;
  outside_pic_url?: string | null;
}

export default function DriverAccountScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(
    null,
  );
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails | null>(
    null,
  );

  useEffect(() => {
    if (!user) return;
    // Fetch driver profile using auth user's id (drivers.id = auth user id)
    supabase
      .from("drivers")
      .select(
        "vehicle_model, vehicle_plate, rating, total_trips, total_rides, is_online, full_name, phone, email, total_earnings",
      )
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setDriverProfile(data as any);
      });
    // Also fetch vehicle details
    supabase
      .from("vehicle_details")
      .select("car_model, number_plate, outside_pic_url")
      .eq("driver_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setVehicleDetails(data as any);
      });
  }, [user]);

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of Driver Mode?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            // Mark driver offline before signing out
            if (user) {
              await supabase
                .from("drivers")
                .update({
                  is_online: false,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", user.id);
            }
            await signOut();
            router.replace("/(auth)/sign-in");
          },
        },
      ],
    );
  };

  const renderMenuItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    color: string = "black",
  ) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconBox, { backgroundColor: "#F4F4F4" }]}>
          <MaterialCommunityIcons name={icon as any} size={22} color={color} />
        </View>
        <View>
          <Text style={[styles.menuItemTitle, { color }]}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSub}>{subtitle}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Account</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.switchBtn}
        >
          <Ionicons name="swap-horizontal" size={18} color="#1C6EF2" />
          <Text style={styles.switchBtnText}>Rider</Text>
        </TouchableOpacity>
      </View>

      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Profile Card */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() ?? "D"}
            </Text>
            <View style={styles.onlineBadge}>
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor: driverProfile?.is_online
                      ? "#1C6EF2"
                      : "#CCC",
                  },
                ]}
              />
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {driverProfile?.full_name ||
                user?.user_metadata?.full_name ||
                "Driver Partner"}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FFB800" />
              <Text style={styles.ratingText}>
                {driverProfile?.rating?.toFixed(2) ?? "5.00"}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle Info — from vehicle_details table */}
        {vehicleDetails && (
          <View style={styles.vehicleCard}>
            <Ionicons name="car-sport-outline" size={20} color="#1C6EF2" />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleModel}>
                {vehicleDetails.car_model ||
                  driverProfile?.vehicle_model ||
                  "Vehicle"}
              </Text>
              <Text style={styles.vehiclePlate}>
                {vehicleDetails.number_plate ||
                  driverProfile?.vehicle_plate ||
                  ""}
              </Text>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>
              {driverProfile?.total_trips ?? 0}
            </Text>
            <Text style={styles.statLbl}>Trips</Text>
          </View>
          <View style={[styles.statBox, styles.statSep]}>
            <Text style={styles.statVal}>
              {driverProfile?.rating?.toFixed(1) ?? "5.0"}
            </Text>
            <Text style={styles.statLbl}>Rating</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>
              {driverProfile?.is_online ? "🟢" : "⚫"}
            </Text>
            <Text style={styles.statLbl}>Status</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          {renderMenuItem(
            "wallet-outline",
            "Weekly Earnings",
            "View breakdown by day",
            undefined,
          )}
          {renderMenuItem(
            "bank-transfer",
            "Payout Settings",
            "Bank account & PayShap",
            undefined,
          )}
        </View>

        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Vehicle & Documents</Text>
          {renderMenuItem(
            "car-outline",
            "Vehicle Details",
            "Edit vehicle information",
            undefined,
          )}
          {renderMenuItem(
            "file-document-outline",
            "Documents",
            "License & Insurance",
            undefined,
          )}
          {renderMenuItem(
            "shield-check-outline",
            "Safety",
            "Emergency contacts",
            undefined,
          )}
        </View>

        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Support</Text>
          {renderMenuItem("headset", "Help Center", "Get support", undefined)}
          {renderMenuItem(
            "information-outline",
            "About",
            "App version & policies",
            undefined,
          )}
        </View>

        {/* Go Back to Rider Mode */}
        <TouchableOpacity
          style={styles.riderModeBtn}
          onPress={() => router.replace("/(root)/(tabs)/home")}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color="black"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.riderModeBtnText}>Switch to Rider Mode</Text>
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C6EF233",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  switchBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C6EF2",
    marginLeft: 4,
  },
  profileSection: {
    flexDirection: "row",
    padding: 24,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  avatarText: { color: "white", fontSize: 30, fontWeight: "bold" },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineDot: { width: 12, height: 12, borderRadius: 6 },
  userInfo: { marginLeft: 18, flex: 1 },
  userName: { fontSize: 22, fontWeight: "700", marginBottom: 3, color: "#FFF" },
  userEmail: { fontSize: 14, color: "#AAA", marginBottom: 8 },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E2200",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#7A5B00",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
    color: "#FFE066",
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    backgroundColor: "#1C6EF215",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1C6EF230",
  },
  vehicleInfo: { marginLeft: 12 },
  vehicleModel: { fontSize: 15, fontWeight: "700", color: "#FFF" },
  vehiclePlate: { fontSize: 13, color: "#AAA", marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#1E1E1E",
    borderRadius: 18,
    paddingVertical: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#333",
  },
  statBox: { flex: 1, alignItems: "center" },
  statSep: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#333",
  },
  statVal: { fontSize: 18, fontWeight: "800", marginBottom: 3, color: "#FFF" },
  statLbl: { fontSize: 11, color: "#888", textTransform: "uppercase" },
  section: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  menuItemLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    backgroundColor: "#1E1E1E",
  },
  menuItemTitle: { fontSize: 15, fontWeight: "600", color: "#EEE" },
  menuItemSub: { fontSize: 12, color: "#888", marginTop: 2 },
  riderModeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    marginHorizontal: 20,
    height: 52,
    backgroundColor: "#FFF",
    borderRadius: 14,
  },
  riderModeBtnText: { fontSize: 15, fontWeight: "700", color: "#000" },
  signOutBtn: {
    marginTop: 12,
    marginHorizontal: 20,
    height: 52,
    backgroundColor: "#1E0A0A",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4A1111",
  },
  signOutText: { color: "#FF3B30", fontSize: 15, fontWeight: "700" },
});
