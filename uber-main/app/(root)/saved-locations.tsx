import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GoogleTextInput from "@/components/GoogleTextInput";
import { icons } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function SavedLocations() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_locations")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error && error.code !== "42P01") {
        console.error("Error fetching locations", error);
      } else {
        setLocations(data || []);
      }
    } catch {
      console.log("Supabase error, possibly table doesn't exist yet.");
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleSaveLocation = async () => {
    if (!title) {
      Alert.alert("Missing Title", "Please enter a title (e.g. Home, Work).");
      return;
    }
    if (!selectedLocation) {
      Alert.alert("Missing Location", "Please search and select a location.");
      return;
    }

    try {
      const { error } = await supabase.from("saved_locations").insert({
        user_id: user?.id,
        title: title,
        address: selectedLocation.address,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });

      if (error) {
        Alert.alert(
          "Database Error",
          "Ensure the saved_locations table exists.",
        );
        console.error(error);
        return;
      }

      setIsAdding(false);
      setTitle("");
      setSelectedLocation(null);
      fetchLocations();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("saved_locations").eq("id", id).delete();
    fetchLocations();
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-5 pt-2 flex-row items-center mb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-JakartaExtraBold">
          Saved Locations
        </Text>
      </View>

      {isAdding ? (
        <View className="px-5 flex-1">
          {!selectedLocation ? (
            <>
              <Text className="text-white font-JakartaMedium mb-2">
                Search Address
              </Text>
              <GoogleTextInput
                icon={icons.search}
                initialLocation="Type address..."
                containerStyle="mb-6"
                textInputBackgroundColor="#1E1E1E"
                handlePress={(loc) => setSelectedLocation(loc)}
              />
            </>
          ) : (
            <>
              <Text className="text-white font-JakartaMedium mb-2 mt-4">
                Location Title (e.g., Home, Gym)
              </Text>
              <TextInput
                className="bg-neutral-900 text-white p-4 rounded-xl mb-4 font-JakartaMedium"
                placeholder="Title"
                placeholderTextColor="#666"
                value={title}
                onChangeText={setTitle}
              />
              <TouchableOpacity
                className="py-4 bg-white rounded-full items-center mb-4 mt-4"
                onPress={handleSaveLocation}
              >
                <Text className="text-black font-JakartaBold text-lg">
                  Save Location
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            className="mt-auto mb-10 py-4 bg-neutral-800 rounded-full items-center"
            onPress={() => {
              setIsAdding(false);
              setSelectedLocation(null);
              setTitle("");
            }}
          >
            <Text className="text-white font-JakartaBold">Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-1 px-5">
          {loading ? (
            <ActivityIndicator size="large" color="white" className="mt-10" />
          ) : locations.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Ionicons name="bookmark-outline" size={64} color="#333" />
              <Text className="text-white text-lg font-JakartaBold mt-4">
                No Saved Locations
              </Text>
              <Text className="text-neutral-500 text-sm font-JakartaMedium text-center mt-2 px-10">
                You haven't saved any locations yet. Add your home or work for
                quicker bookings.
              </Text>
            </View>
          ) : (
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 120 }}
            >
              {locations.map((loc) => (
                <View
                  key={loc.id}
                  className="flex-row items-center bg-neutral-900 p-4 rounded-2xl mb-3 border border-white/5"
                >
                  <View className="w-10 h-10 bg-black rounded-full items-center justify-center mr-4">
                    <Ionicons name="home" size={18} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-JakartaBold">
                      {loc.title}
                    </Text>
                    <Text
                      className="text-neutral-500 text-xs mt-1"
                      numberOfLines={1}
                    >
                      {loc.address}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(loc.id)}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            className="mb-10 py-4 bg-white rounded-full items-center mt-4"
            onPress={() => setIsAdding(true)}
          >
            <Text className="text-black font-JakartaBold text-lg">
              Add New Location
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
