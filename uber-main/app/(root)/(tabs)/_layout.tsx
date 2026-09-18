import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { View } from "react-native";

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  return (
    <View
      className={`w-10 h-10 items-center justify-center rounded-[18px] ${focused ? "bg-white" : ""}`}
    >
      <Ionicons
        name={name as any}
        size={22}
        color={focused ? "black" : "#777"}
      />
    </View>
  );
};

export default function Layout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "#777",
        tabBarShowLabel: false,
        tabBarBackground: () => (
          <BlurView
            tint="dark"
            intensity={95}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 32,
              overflow: "hidden",
              backgroundColor: "rgba(0,0,0,0.5)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.05)",
            }}
          />
        ),
        tabBarStyle: {
          backgroundColor: "transparent",
          position: "absolute",
          bottom: 20,
          left: 16,
          right: 16,
          height: 70,
          borderRadius: 32,
          borderTopWidth: 0,
          elevation: 0,
          overflow: "visible",
          paddingBottom: 0,
          paddingTop: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: () =>
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: "Rides",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="receipt" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: () =>
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chatbubble" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: () =>
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: () =>
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
    </Tabs>
  );
}
