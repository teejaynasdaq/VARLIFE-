import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { notifyLocal } from "@/lib/notifications";
import { SA_INSTITUTIONS } from "@/lib/studentVerification";
import {
  submitStudentVerification,
  getStudentVerificationStatus,
  uploadImageToSupabase,
  supabase,
} from "@/lib/supabase";

const CATEGORIES = [
  { id: "all", name: "All Offers", icon: "apps" },
  { id: "rides", name: "Rides", icon: "car" },
  { id: "food", name: "Food", icon: "fast-food" },
  { id: "coffee", name: "Cafe", icon: "cafe" },
  { id: "grocery", name: "Grocery", icon: "basket" },
  { id: "entertainment", name: "Entertainment", icon: "film" },
  { id: "campus", name: "Campus", icon: "school" },
];

const FALLBACK_OFFERS = [
  {
    id: "local-ride-10",
    title: "10% off campus rides",
    description: "Student fare on VAR Go trips that start or end near campus.",
    category: "rides",
    discount_percent: 10,
  },
  {
    id: "local-coffee",
    title: "Cafe partner perk",
    description: "Flash your verified student status for partner cafe deals.",
    category: "coffee",
    discount_percent: 15,
  },
  {
    id: "local-campus",
    title: "Campus late-night pool",
    description: "Shared rides after late lectures at a student rate.",
    category: "campus",
    discount_percent: 12,
  },
];

export default function StudentExperience() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);
  const [savedOffers, setSavedOffers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [verificationStatus, setVerificationStatus] = useState<
    "none" | "pending" | "approved" | "rejected"
  >("none");

  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [institution, setInstitution] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentNumber, setStudentNo] = useState("");
  const [cardPhotoUri, setCardPhotoUri] = useState<string | null>(null);
  const [selfiePhotoUri, setSelfiePhotoUri] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showInstitutionSelector, setShowInstitutionSelector] = useState(false);
  const [institutionSearch, setInstitutionSearch] = useState("");

  const isStudent = verificationStatus === "approved";

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const verification = await getStudentVerificationStatus(user.id);
      if (verification?.status) {
        setVerificationStatus(verification.status);
      } else if (user.student_verification_status) {
        setVerificationStatus(user.student_verification_status);
      }

      const { data: offersData, error } = await supabase
        .from("student_offers")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[StudentHub] offers query:", error);
        setOffers(FALLBACK_OFFERS);
      } else if (!offersData || offersData.length === 0) {
        setOffers(FALLBACK_OFFERS);
      } else {
        setOffers(offersData);
      }

      const { data: savedData } = await supabase
        .from("student_saved_offers")
        .select("offer_id")
        .eq("user_id", user.id);

      if (savedData) {
        setSavedOffers(new Set(savedData.map((s: any) => s.offer_id)));
      }
    } catch (err) {
      console.error("Error fetching student data:", err);
      setOffers(FALLBACK_OFFERS);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pickPhoto = async (type: "card" | "selfie") => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === "card" ? [4, 3] : [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      if (type === "card") setCardPhotoUri(result.assets[0].uri);
      else setSelfiePhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmitVerification = async () => {
    if (!user) return;
    if (!institution) {
      Alert.alert("Required", "Please select your institution.");
      return;
    }
    if (!studentEmail.trim()) {
      Alert.alert("Required", "Please enter your student email.");
      return;
    }
    if (!cardPhotoUri || !selfiePhotoUri) {
      Alert.alert(
        "Photos Required",
        "Please upload a photo of your student card and a selfie holding the same card.",
      );
      return;
    }

    setVerifying(true);
    try {
      const uid = user.id;
      const cardUrl = await uploadImageToSupabase(
        cardPhotoUri,
        "verifications",
        `${uid}/card-${Date.now()}.jpg`,
      );
      const selfieUrl = await uploadImageToSupabase(
        selfiePhotoUri,
        "verifications",
        `${uid}/selfie-${Date.now()}.jpg`,
      );

      if (!cardUrl || !selfieUrl) {
        throw new Error("Failed to upload verification photos.");
      }

      await submitStudentVerification({
        user_id: uid,
        institution,
        student_number: studentNumber.trim() || undefined,
        student_email: studentEmail.trim().toLowerCase(),
        card_photo_url: cardUrl,
        selfie_photo_url: selfieUrl,
      });

      setVerificationStatus("pending");
      setShowVerifyForm(false);
      await notifyLocal(
        "Verification Submitted",
        "Your student verification is under review. We'll notify you once approved.",
      );
      Alert.alert(
        "Submitted for Review",
        "Your documents have been submitted. Verification typically completes within 24–48 hours.",
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit verification.");
    } finally {
      setVerifying(false);
    }
  };

  const toggleSaveOffer = async (offerId: string) => {
    if (!user) return;
    try {
      if (savedOffers.has(offerId)) {
        await supabase
          .from("student_saved_offers")
          .match({ user_id: user.id, offer_id: offerId })
          .delete();
        setSavedOffers((prev) => {
          const next = new Set(prev);
          next.delete(offerId);
          return next;
        });
      } else {
        await supabase.from("student_saved_offers").insert({
          id: `${user.id}_${offerId}`,
          user_id: user.id,
          offer_id: offerId,
        });
        setSavedOffers((prev) => new Set(prev).add(offerId));
      }
    } catch (err) {
      console.error("Error saving offer:", err);
    }
  };

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch =
      offer.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeCategory === "saved") {
      return savedOffers.has(offer.id) && matchesSearch;
    }

    const matchesCategory =
      activeCategory === "all" || offer.category === activeCategory;
    return matchesCategory && matchesSearch;
  });

  const filteredInstitutions = SA_INSTITUTIONS.filter((inst) =>
    inst.toLowerCase().includes(institutionSearch.toLowerCase()),
  );

  const Header = ({ title }: { title: string }) => (
    <View className="px-5 pt-2 flex-row items-center mb-6">
      <TouchableOpacity
        onPress={() => router.back()}
        className="mr-4"
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={28} color="white" />
      </TouchableOpacity>
      <Text className="text-white text-xl font-JakartaExtraBold tracking-[2px]">
        {title}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!isStudent) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <Header title="VARLIFE Students" />

        {verificationStatus === "pending" ? (
          <View className="flex-1 px-5 justify-center items-center">
            <View className="w-24 h-24 rounded-full bg-neutral-900 border border-neutral-800 items-center justify-center mb-2">
              <Ionicons name="time-outline" size={48} color="white" />
            </View>
            <Text className="text-white text-2xl font-JakartaExtraBold mt-6 text-center">
              Verification Pending
            </Text>
            <Text className="text-neutral-400 text-base font-JakartaMedium text-center mt-4 px-6 leading-6">
              We are reviewing your student card and selfie. You will get a
              notification once approved.
            </Text>
          </View>
        ) : verificationStatus === "rejected" ? (
          <View className="flex-1 px-5 justify-center items-center">
            <View className="w-24 h-24 rounded-full bg-neutral-900 border border-neutral-800 items-center justify-center">
              <Ionicons name="close-circle-outline" size={48} color="#F56565" />
            </View>
            <Text className="text-white text-2xl font-JakartaExtraBold mt-6 text-center">
              Verification Declined
            </Text>
            <Text className="text-neutral-400 text-base font-JakartaMedium text-center mt-4 px-6 leading-6">
              Please resubmit clear photos of your student card and selfie.
            </Text>
            <TouchableOpacity
              className="bg-white w-full py-4 rounded-full mt-10 items-center"
              onPress={() => setShowVerifyForm(true)}
            >
              <Text className="text-black font-JakartaBold text-lg">
                Resubmit Verification
              </Text>
            </TouchableOpacity>
          </View>
        ) : !showVerifyForm ? (
          <View className="flex-1 px-5 justify-center items-center">
            <View className="w-24 h-24 rounded-full bg-neutral-900 border border-neutral-800 items-center justify-center">
              <Ionicons name="school" size={48} color="white" />
            </View>
            <Text className="text-white text-3xl font-JakartaExtraBold mt-6 text-center">
              Student Exclusive
            </Text>
            <Text className="text-neutral-400 text-base font-JakartaMedium text-center mt-4 px-4 leading-6">
              Verify your student status with a photo of your student card and a
              selfie holding the same card to unlock exclusive discounts.
            </Text>
            <TouchableOpacity
              className="bg-white w-full py-4 rounded-full mt-10 items-center"
              onPress={() => setShowVerifyForm(true)}
            >
              <Text className="text-black font-JakartaBold text-lg">
                Verify Student Status
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-5"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            <Text className="text-white text-2xl font-JakartaExtraBold mb-2">
              Verify Student Identity
            </Text>
            <Text className="text-neutral-500 text-sm font-JakartaMedium mb-8 leading-5">
              Upload a clear photo of your student card and a selfie while
              holding the same card. Documents are stored securely and reviewed
              by our team.
            </Text>

            <Text className="text-neutral-400 text-xs font-JakartaBold uppercase tracking-wider mb-2">
              University / College
            </Text>
            <TouchableOpacity
              onPress={() => setShowInstitutionSelector(true)}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-4 mb-5 flex-row justify-between items-center"
            >
              <Text
                className={
                  institution
                    ? "text-white font-JakartaMedium"
                    : "text-neutral-500 font-JakartaMedium"
                }
              >
                {institution || "Select your institution"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            <Text className="text-neutral-400 text-xs font-JakartaBold uppercase tracking-wider mb-2">
              Student Email
            </Text>
            <TextInput
              placeholder="username@institution.ac.za"
              placeholderTextColor="#555"
              autoCapitalize="none"
              keyboardType="email-address"
              className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-4 mb-5 text-white font-JakartaMedium"
              value={studentEmail}
              onChangeText={setStudentEmail}
            />

            <Text className="text-neutral-400 text-xs font-JakartaBold uppercase tracking-wider mb-2">
              Student Number (optional)
            </Text>
            <TextInput
              placeholder="Enter your student number"
              placeholderTextColor="#555"
              className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-4 mb-8 text-white font-JakartaMedium"
              value={studentNumber}
              onChangeText={setStudentNo}
            />

            <Text className="text-neutral-400 text-xs font-JakartaBold uppercase tracking-wider mb-3">
              Student Card Photo
            </Text>
            <TouchableOpacity
              onPress={() => pickPhoto("card")}
              className="bg-neutral-900 border border-dashed border-neutral-700 rounded-2xl h-40 mb-5 items-center justify-center overflow-hidden"
            >
              {cardPhotoUri ? (
                <Image
                  source={{ uri: cardPhotoUri }}
                  className="w-full h-full"
                />
              ) : (
                <>
                  <Ionicons name="card-outline" size={36} color="#555" />
                  <Text className="text-neutral-500 font-JakartaMedium mt-2">
                    Tap to photograph student card
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text className="text-neutral-400 text-xs font-JakartaBold uppercase tracking-wider mb-3">
              Selfie with Student Card
            </Text>
            <TouchableOpacity
              onPress={() => pickPhoto("selfie")}
              className="bg-neutral-900 border border-dashed border-neutral-700 rounded-2xl h-40 mb-8 items-center justify-center overflow-hidden"
            >
              {selfiePhotoUri ? (
                <Image
                  source={{ uri: selfiePhotoUri }}
                  className="w-full h-full"
                />
              ) : (
                <>
                  <Ionicons
                    name="person-circle-outline"
                    size={36}
                    color="#555"
                  />
                  <Text className="text-neutral-500 font-JakartaMedium mt-2">
                    Tap to take selfie holding card
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className={`w-full py-4 rounded-full items-center ${verifying ? "bg-neutral-800" : "bg-white"}`}
              onPress={handleSubmitVerification}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text className="text-black font-JakartaBold text-lg">
                  Submit for Review
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowVerifyForm(false)}
              className="mt-5 py-2 items-center mb-10"
            >
              <Text className="text-neutral-500 font-JakartaBold text-sm uppercase tracking-widest">
                Cancel
              </Text>
            </TouchableOpacity>

            <Modal
              visible={showInstitutionSelector}
              animationType="slide"
              transparent
            >
              <SafeAreaView className="flex-1 bg-black/95 justify-end">
                <View className="bg-neutral-950 border-t border-neutral-900 rounded-t-[32px] h-[80%] px-5 pt-6">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-white text-xl font-JakartaExtraBold">
                      Select Institution
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowInstitutionSelector(false)}
                    >
                      <Ionicons name="close-circle" size={28} color="#666" />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row items-center bg-neutral-900 rounded-full px-4 py-3 mb-4">
                    <Ionicons name="search" size={18} color="#666" />
                    <TextInput
                      placeholder="Search institutions..."
                      placeholderTextColor="#666"
                      className="flex-1 text-white font-JakartaMedium ml-3"
                      value={institutionSearch}
                      onChangeText={setInstitutionSearch}
                    />
                  </View>
                  <FlatList
                    data={filteredInstitutions}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setInstitution(item);
                          setShowInstitutionSelector(false);
                          setInstitutionSearch("");
                        }}
                        className="py-4 border-b border-neutral-900"
                      >
                        <Text className="text-white font-JakartaMedium text-base">
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </SafeAreaView>
            </Modal>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between border-b border-white/5">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-JakartaExtraBold tracking-[2px]">
            Student Hub
          </Text>
        </View>
        <TouchableOpacity onPress={() => setActiveCategory("saved")}>
          <Ionicons
            name={activeCategory === "saved" ? "heart" : "heart-outline"}
            size={24}
            color={activeCategory === "saved" ? "white" : "#888"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="mx-5 mt-5 mb-2 rounded-3xl bg-neutral-900 border border-neutral-800 p-5">
          <Text className="text-white text-lg font-JakartaExtraBold">
            Verified student
          </Text>
          <Text className="text-neutral-400 font-JakartaMedium text-sm mt-2 leading-5">
            Exclusive campus deals and ride discounts for your account.
          </Text>
        </View>

        <View className="px-5 py-4">
          <View className="flex-row items-center bg-neutral-900 rounded-full px-4 py-3 border border-neutral-800">
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              placeholder="Search offers..."
              placeholderTextColor="#666"
              className="flex-1 text-white font-JakartaMedium ml-3"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5 mb-6"
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              className={`flex-row items-center px-4 py-2 rounded-full mr-3 border ${activeCategory === cat.id ? "bg-white border-white" : "bg-transparent border-neutral-800"}`}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={activeCategory === cat.id ? "#000" : "#AAA"}
              />
              <Text
                className={`ml-2 font-JakartaBold text-sm ${activeCategory === cat.id ? "text-black" : "text-neutral-400"}`}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="px-5 pb-10">
          <Text className="text-white text-lg font-JakartaExtraBold mb-4">
            {activeCategory === "saved" ? "Saved Deals" : "Student Deals"}
          </Text>
          {filteredOffers.length === 0 ? (
            <View className="py-12 items-center rounded-3xl border border-neutral-900 bg-neutral-950">
              <Ionicons name="basket-outline" size={48} color="#444" />
              <Text className="text-neutral-500 font-JakartaBold mt-4">
                No offers found
              </Text>
            </View>
          ) : (
            filteredOffers.map((offer) => (
              <View
                key={offer.id}
                className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-4 mb-4 flex-row items-center"
              >
                <View className="w-12 h-12 rounded-2xl bg-black border border-neutral-800 items-center justify-center mr-4">
                  <Ionicons name="pricetag-outline" size={20} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-JakartaBold text-base">
                    {offer.title}
                  </Text>
                  {offer.description ? (
                    <Text
                      className="text-neutral-400 font-JakartaMedium text-xs mt-1"
                      numberOfLines={2}
                    >
                      {offer.description}
                    </Text>
                  ) : null}
                  {offer.discount_percent ? (
                    <View className="bg-white px-2 py-0.5 rounded-full self-start mt-2">
                      <Text className="text-black text-[10px] font-JakartaBold">
                        {offer.discount_percent}% OFF
                      </Text>
                    </View>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => toggleSaveOffer(offer.id)}>
                  <Ionicons
                    name={savedOffers.has(offer.id) ? "heart" : "heart-outline"}
                    size={22}
                    color={savedOffers.has(offer.id) ? "white" : "#888"}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
