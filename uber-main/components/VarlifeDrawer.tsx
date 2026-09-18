import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.82;

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  rating?: number;
  rideCount?: number;
  onSignOut: () => void;
}

const MENU_ITEMS = [
  {
    icon: "time-outline" as const,
    label: "Ride History",
    route: "/(root)/(tabs)/rides",
  },
  {
    icon: "wallet-outline" as const,
    label: "Payments",
    route: "/(root)/payment",
  },
  {
    icon: "school-outline" as const,
    label: "Student Experience",
    route: "/(root)/student-experience",
  },
  {
    icon: "settings-outline" as const,
    label: "Settings",
    route: "/(root)/settings",
  },
  {
    icon: "bookmark-outline" as const,
    label: "Saved Places",
    route: "/(root)/saved-locations",
  },
];

export default function VarlifeDrawer({
  visible,
  onClose,
  userName = "Guest",
  userEmail,
  userAvatar,
  rating = 4.98,
  rideCount = 0,
  onSignOut,
}: DrawerProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const navigate = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 flex-row">
        <Animated.View
          style={{
            width: DRAWER_WIDTH,
            transform: [{ translateX: slideAnim }],
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
          }}
          className="bg-neutral-950 h-full rounded-r-[32px] border-r border-neutral-900"
        >
          <TouchableOpacity
            className="flex-row items-center px-6 py-4 mb-2"
            onPress={() => navigate("/(root)/(tabs)/profile")}
          >
            {userAvatar ? (
              <Image
                source={{ uri: userAvatar }}
                className="w-14 h-14 rounded-full mr-4 bg-neutral-800"
              />
            ) : (
              <View className="w-14 h-14 rounded-full bg-neutral-800 items-center justify-center mr-4">
                <Ionicons name="person" size={28} color="#666" />
              </View>
            )}
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-white text-lg font-JakartaExtraBold">
                  {userName}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#666"
                  style={{ marginLeft: 4 }}
                />
              </View>
              <View className="flex-row items-center mt-1">
                <Text className="text-yellow-400 text-xs mr-1">★★★★★</Text>
                <Text className="text-neutral-500 text-xs font-JakartaMedium">
                  {rating.toFixed(2)} ({rideCount})
                </Text>
              </View>
              {userEmail ? (
                <Text
                  className="text-neutral-600 text-xs mt-1"
                  numberOfLines={1}
                >
                  {userEmail}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>

          <View className="px-4 mt-2 flex-1">
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                className="flex-row items-center px-3 py-4"
                onPress={() => navigate(item.route)}
              >
                <Ionicons name={item.icon} size={22} color="#888" />
                <Text className="text-white font-JakartaMedium text-base ml-4">
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="px-6 mt-auto">
            {/* Driver mode — yellow tinted glass */}
            <TouchableOpacity
              style={styles.driverBtn}
              activeOpacity={0.75}
              onPress={() => {
                onClose();
                setTimeout(() => router.push("/(driver)"), 200);
              }}
            >
              <Text style={styles.driverBtnText}>Driver mode</Text>
            </TouchableOpacity>

            {/* Logout — subtle red glass */}
            <TouchableOpacity
              style={styles.logoutBtn}
              activeOpacity={0.75}
              onPress={() => {
                onClose();
                onSignOut();
              }}
            >
              <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Pressable className="flex-1 bg-black/60" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  driverBtn: {
    backgroundColor: "rgba(223,255,0,0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(223,255,0,0.55)",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#DFFF00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  driverBtnText: {
    color: "#DFFF00",
    fontFamily: "Jakarta-ExtraBold",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  logoutBtn: {
    backgroundColor: "rgba(220,38,38,0.10)",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.30)",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 4,
  },
  logoutBtnText: {
    color: "#ef4444",
    fontFamily: "Jakarta-Bold",
    fontSize: 13,
  },
});
