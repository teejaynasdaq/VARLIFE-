import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  View,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import { icons } from "@/constants";
import { googleMaps } from "@/lib/googleMaps";
import {
  getRideRecommendations,
  RideRecommendation,
} from "@/lib/rideRecommendations";
import { useLocationStore } from "@/store";
import { GoogleInputProps } from "@/types/type";

interface ExtendedProps extends GoogleInputProps {
  userId?: string;
}

const GoogleTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  inlinePredictions = false,
  handlePress,
  userId,
}: ExtendedProps) => {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<RideRecommendation[]>(
    [],
  );
  const [showPredictions, setShowPredictions] = useState(false);
  const [loading, setLoading] = useState(false);

  const { userLatitude, userLongitude } = useLocationStore();

  useEffect(() => {
    if (!userId) return;
    getRideRecommendations(userId).then(setRecommendations);
  }, [userId]);

  useEffect(() => {
    if (query.length < 3) {
      setPredictions([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      fetchPredictions(query);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const fetchPredictions = async (input: string) => {
    setLoading(true);
    try {
      const results = await googleMaps.searchPlaces(
        input,
        userLatitude || 0,
        userLongitude || 0,
      );
      if (results) {
        setPredictions(results);
      }
    } catch (error) {
      console.error("Error fetching Google predictions:", error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (
    latitude: number,
    longitude: number,
    address: string,
  ) => {
    setQuery(address);
    setShowPredictions(false);
    handlePress({ latitude, longitude, address });
  };

  const handlePredictionPress = async (prediction: any) => {
    setQuery(prediction.description);
    setShowPredictions(false);

    const details = await googleMaps.getPlaceDetails(prediction.placeId);
    if (details) {
      selectLocation(
        details.latitude,
        details.longitude,
        prediction.description,
      );
    }
  };

  const handleRecommendationPress = (rec: RideRecommendation) => {
    selectLocation(rec.latitude, rec.longitude, rec.address);
  };

  return (
    <View className={`relative ${containerStyle}`}>
      <View
        className="flex flex-row items-center rounded-full px-5 py-4"
        style={{
          backgroundColor: textInputBackgroundColor || "#1E1E1E",
        }}
      >
        {icon && (
          <Image
            source={icon}
            className="w-5 h-5 mr-4 tint-neutral-400"
            resizeMode="contain"
          />
        )}
        <TextInput
          className="flex-1 text-[15px] font-JakartaMedium text-white"
          placeholder={initialLocation ?? "Where to?"}
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setShowPredictions(true)}
        />
        {loading && (
          <ActivityIndicator color="#0286FF" size="small" className="ml-2" />
        )}
      </View>

      {showPredictions && query.length < 3 && (
        <ScrollView
          className={`${inlinePredictions ? "relative mt-3" : "absolute top-full mt-2"} left-0 right-0 max-h-96 rounded-2xl bg-[#1A1A1A] shadow-lg border border-[#2A2A2A] z-[100] overflow-hidden`}
          keyboardShouldPersistTaps="handled"
        >
          {/* RECENT SEARCHES */}
          <Text className="px-5 pt-4 pb-2 text-[10px] font-JakartaBold text-[#888] uppercase tracking-widest">
            Recent Searches
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-5 mb-4"
            contentContainerStyle={{ gap: 8 }}
          >
            {[
              { id: "rec-1", label: "Dwarsloop Mall", address: "Dwarsloop Mall, Bushbuckridge", latitude: -24.8083, longitude: 31.0664 },
              { id: "rec-2", label: "Hazyview", address: "Hazyview Village, Hazyview", latitude: -25.0408, longitude: 31.1275 },
              { id: "rec-3", label: "Nelspruit", address: "Nelspruit City Centre, Nelspruit", latitude: -25.4745, longitude: 30.9703 },
            ].map((rec) => (
              <TouchableOpacity
                key={rec.id}
                onPress={() => selectLocation(rec.latitude, rec.longitude, rec.address)}
                className="bg-[#2A2A2A] px-4 py-2 rounded-full border border-[#3A3A3A]"
              >
                <Text className="text-white text-xs font-JakartaBold">{rec.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* SUGGESTIONS */}
          <Text className="px-5 pt-2 pb-2 text-[10px] font-JakartaBold text-[#888] uppercase tracking-widest">
            Suggestions
          </Text>
          {[
            { id: "sug-1", label: "Dwarsloop Mall", desc: "Bushbuckridge", dist: "8.4 km", latitude: -24.8083, longitude: 31.0664 },
            { id: "sug-2", label: "Bushbuckridge Plaza", desc: "Bushbuckridge", dist: "3.1 km", latitude: -24.8398, longitude: 31.0425 },
            { id: "sug-3", label: "Hazyview Village", desc: "Hazyview", dist: "23.7 km", latitude: -25.0408, longitude: 31.1275 },
            { id: "sug-4", label: "Nelspruit City Centre", desc: "Nelspruit", dist: "47.2 km", latitude: -25.4745, longitude: 30.9703 },
            { id: "sug-5", label: "White River Crossing", desc: "White River", dist: "39.8 km", latitude: -25.3312, longitude: 31.0125 },
          ].map((rec) => (
            <TouchableOpacity
              key={rec.id}
              className="px-6 py-4 border-b border-[#2A2A2A]/40 flex-row items-center justify-between"
              onPress={() => selectLocation(rec.latitude, rec.longitude, `${rec.label}, ${rec.desc}`)}
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-9 h-9 rounded-full bg-[#1E1E1E] items-center justify-center mr-4 border border-[#2A2A2A]">
                  <Ionicons name="location-sharp" size={16} color="#888" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-JakartaBold text-white" numberOfLines={1}>
                    {rec.label}
                  </Text>
                  <Text className="text-xs text-[#888] mt-0.5" numberOfLines={1}>
                    {rec.desc}
                  </Text>
                </View>
              </View>
              <Text className="text-xs font-JakartaBold text-[#888]">
                {rec.dist}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {showPredictions && predictions.length > 0 && (
        <ScrollView
          className={`${inlinePredictions ? "relative mt-3" : "absolute top-full mt-2"} left-0 right-0 max-h-96 rounded-2xl bg-[#1A1A1A] shadow-lg border border-[#2A2A2A] z-[100] overflow-hidden`}
          keyboardShouldPersistTaps="handled"
        >
          {predictions.map((prediction: any, index) => (
            <TouchableOpacity
              key={index}
              className="px-6 py-5 border-b border-[#2A2A2A] flex-row items-center justify-between"
              onPress={() => handlePredictionPress(prediction)}
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-10 h-10 rounded-full bg-[#171717] items-center justify-center mr-4 border border-[#2A2A2A]">
                  <Image
                    source={icons.point}
                    className="w-4 h-4"
                    style={{ tintColor: "#FFF" }}
                    resizeMode="contain"
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-JakartaBold text-white flex-shrink"
                    numberOfLines={1}
                  >
                    {prediction.mainText}
                  </Text>
                  {prediction.secondaryText ? (
                    <Text
                      className="text-xs text-[#888] mt-0.5"
                      numberOfLines={1}
                    >
                      {prediction.secondaryText}
                    </Text>
                  ) : null}
                </View>
              </View>
              {prediction.distanceMeters > 0 && (
                <Text className="text-xs font-JakartaBold text-[#888]">
                  {(prediction.distanceMeters / 1000).toFixed(1)} km
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default GoogleTextInput;
