import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { updateUserProfile, uploadImageToSupabase } from "@/lib/supabase";

const SettingItem = ({
  icon,
  label,
  value,
  color = "white",
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  color?: string;
  onPress?: () => void;
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity
      className="flex-row items-center justify-between py-5 border-b border-white/5"
      onPress={handlePress}
    >
      <View className="flex-row items-center flex-shrink mr-2">
        <View className="w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center">
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <Text className="text-white text-base font-JakartaMedium ml-4 flex-shrink" numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View className="flex-row items-center flex-shrink max-w-[50%]">
        {value && (
          <Text className="text-neutral-500 text-sm mr-2 flex-shrink" numberOfLines={1}>{value}</Text>
        )}
        <Ionicons name="chevron-forward" size={18} color="#444" />
      </View>
    </TouchableOpacity>
  );
};

const Profile = () => {
  const { user, signOut, refreshUser } = useAuth();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.full_name || "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.profile_image_url || null,
  );
  const [saving, setSaving] = useState(false);
  const displayName =
    editForm.name ||
    user?.full_name ||
    "Valued Guest";
  const displayAvatar =
    avatarUrl ||
    user?.profile_image_url ||
    null;

  const handleLogOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;

      // Upload new avatar if it's a local file
      if (avatarUrl && avatarUrl.startsWith("file://")) {
        const uploaded = await uploadImageToSupabase(
          avatarUrl,
          "uploads",
          `profiles/${user.id}-${Date.now()}.jpg`,
        );
        if (uploaded) finalAvatarUrl = uploaded;
      }

      await updateUserProfile({
        id: user.clerk_id ?? user.id,
        fullName: editForm.name,
        profileImageUrl: finalAvatarUrl,
      });

      await refreshUser();

      setAvatarUrl(finalAvatarUrl);
      setIsEditModalVisible(false);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (error: any) {
      Alert.alert("Error updating profile", error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-5 pt-2 flex-row justify-between items-center mb-6">
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-JakartaExtraBold tracking-[4px]">
          VARLIFE
        </Text>
        <View className="w-10 h-10 rounded-full border border-neutral-800 overflow-hidden bg-neutral-900 items-center justify-center">
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} className="w-full h-full" />
          ) : (
            <Ionicons name="person" size={18} color="#555" />
          )}
        </View>
      </View>

      <ScrollView
        className="px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mt-4 mb-10">
          <View className="relative">
            <View className="w-32 h-32 rounded-full border-4 border-neutral-900 overflow-hidden bg-neutral-900 items-center justify-center">
              {displayAvatar ? (
                <Image
                  source={{ uri: displayAvatar }}
                  className="w-full h-full"
                />
              ) : (
                <Ionicons name="person" size={48} color="#444" />
              )}
            </View>
            <View className="absolute bottom-0 right-0 bg-neutral-900 w-8 h-8 rounded-full border-2 border-black items-center justify-center z-10">
              <TouchableOpacity onPress={() => setIsEditModalVisible(true)}>
                <Ionicons name="pencil" size={14} color="white" />
              </TouchableOpacity>
            </View>
            <View className="absolute -bottom-4 self-center bg-neutral-900 px-3 py-1 rounded-full border-2 border-black flex-row items-center">
              <Ionicons name="star" size={10} color="white" />
              <Text className="text-white text-[10px] font-JakartaBold ml-1">
                5.00
              </Text>
            </View>
          </View>
          <Text className="text-white text-3xl font-JakartaExtraBold mt-6 text-center">
            {displayName}
          </Text>
        </View>

        <View className="mb-8">
          <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-4">
            Modes
          </Text>
          <View className="bg-dark-100/90 px-5 rounded-[32px] border border-white/5">
            <SettingItem
              icon="car-sport"
              label="Driver Mode"
              value="Earn with VARLIFE"
              onPress={() => router.push("/(driver)")}
            />
            <SettingItem
              icon="school"
              label="Student Experience"
              onPress={() => router.push("/(root)/student-experience")}
            />
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-4">
            Personal Info
          </Text>
          <View className="bg-dark-100/90 px-5 rounded-[32px] border border-white/5">
            <SettingItem
              icon="mail"
              label="Email"
              value={user?.email ? (user.email.length > 20 ? user.email.substring(0, 17) + "..." : user.email) : ""}
              onPress={() => router.push("/(root)/settings")}
            />
            <SettingItem
              icon="location"
              label="Saved Locations"
              onPress={() => router.push("/(root)/saved-locations")}
            />
            <SettingItem
              icon="shield-checkmark"
              label="Security & Privacy"
              onPress={() => router.push("/(root)/security")}
            />
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-4">
            Payment Methods
          </Text>
          <View className="bg-dark-100/90 px-5 rounded-[32px] border border-white/5">
            <SettingItem
              icon="card"
              label="Cards & Wallets"
              value="Apple Pay"
              onPress={() => router.push("/(root)/payment" as any)}
            />
            <SettingItem
              icon="receipt"
              label="Ride History"
              onPress={() => router.push("/(root)/(tabs)/rides")}
            />
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-4">
            Support & Care
          </Text>
          <View className="bg-dark-100/90 px-5 rounded-[32px] border border-white/5">
            <SettingItem
              icon="search"
              label="Report Lost Item"
              onPress={() => router.push("/(root)/lost-item" as any)}
            />

            <SettingItem
              icon="help-buoy"
              label="Help Center"
              onPress={() => router.push("/(root)/help" as any)}
            />
            <SettingItem
              icon="people"
              label="Invite Friends"
              onPress={() => router.push("/(root)/invite" as any)}
            />
            <SettingItem
              icon="information-circle"
              label="About VARLIFE"
              onPress={() => router.push("/(root)/about" as any)}
            />
            <SettingItem
              icon="document-text"
              label="Legal & Privacy"
              onPress={() => router.push("/(root)/legal" as any)}
            />
            <SettingItem
              icon="call"
              label="Emergency Support"
              color="#FF3B30"
              onPress={() => {
                Linking.openURL("tel:112"); // Standard emergency number
              }}
            />
          </View>
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center bg-dark-100/90 py-6 rounded-[32px] border border-white/5 mb-10"
          onPress={handleLogOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
          <Text className="text-[#FF6B6B] font-JakartaBold ml-3">Log Out</Text>
        </TouchableOpacity>

        <View className="items-center opacity-30 mb-10">
          <Text className="text-white text-[10px] font-JakartaBold tracking-widest">
            VARLIFE v2.4.1
          </Text>
          <Text className="text-white text-[8px] font-JakartaMedium uppercase mt-1">
            Engineered for Excellence
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/80 justify-end"
        >
          <View
            className="bg-neutral-900 p-6 rounded-t-3xl border-t border-neutral-800"
            style={{ height: "60%" }}
          >
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-white text-xl font-JakartaBold">
                Edit Profile
              </Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity className="items-center mb-8" onPress={pickImage}>
              <View className="w-24 h-24 rounded-full bg-black border-2 border-neutral-700 items-center justify-center mb-4 overflow-hidden">
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    className="w-full h-full"
                  />
                ) : (
                  <Ionicons name="camera" size={32} color="#555" />
                )}
              </View>
              <Text className="text-white font-JakartaMedium">
                Change Photo
              </Text>
            </TouchableOpacity>

            <View className="mb-6">
              <Text className="text-neutral-500 text-xs font-JakartaMedium mb-2 ml-1">
                Full Name
              </Text>
              <TextInput
                value={editForm.name}
                onChangeText={(t) => setEditForm({ ...editForm, name: t })}
                className="bg-black text-white px-4 py-4 rounded-2xl border border-neutral-800 font-JakartaMedium"
                placeholderTextColor="#555"
                placeholder="Enter full name"
              />
            </View>

            <TouchableOpacity
              className="bg-white py-4 rounded-full items-center mt-auto mb-10"
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text className="text-black font-JakartaBold text-lg">
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;
