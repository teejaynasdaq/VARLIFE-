import { Ionicons } from "@expo/vector-icons";
import { Link, router, type Href } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View, KeyboardAvoidingView, Platform } from "react-native";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";

import { auth } from "@/lib/firebase";
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const onSignUpPress = async () => {
    if (!form.email || !form.password || !form.firstName) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );

      // Update user display name
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
      await updateProfile(userCredential.user, {
        displayName: fullName,
      });

      // Send verification email
      try {
        await sendEmailVerification(userCredential.user);
      } catch (verificationError) {
        console.warn("Failed to send verification email:", verificationError);
      }

      router.push("/(auth)/verify-email" as Href);
    } catch (err: any) {
      console.error("[SignUp] Error:", err);
      Alert.alert(
        "Sign Up Error",
        err.message || "Could not create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView className="flex-1 bg-black" keyboardShouldPersistTaps="handled">
        <View className="flex-1 bg-black px-8 py-10 min-h-screen">
          <View className="flex-row items-center mt-10 mb-16">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-JakartaExtraBold tracking-[4px] absolute left-0 right-0 text-center">
              VARLIFE
            </Text>
          </View>

          <View className="mb-12 items-center">
            <Text className="text-5xl text-white font-JakartaExtraBold mb-4 text-center">
              Create{"\n"}Account
            </Text>
            <Text className="text-neutral-500 text-sm font-JakartaMedium text-center leading-6 px-4">
              Join VARLIFE for premium student rides.
            </Text>
          </View>

          <InputField
            label="First Name"
            placeholder="Your first name"
            autoCapitalize="words"
            value={form.firstName}
            onChangeText={(v) => setForm({ ...form, firstName: v })}
          />
          <InputField
            label="Last Name"
            placeholder="Your last name"
            autoCapitalize="words"
            value={form.lastName}
            onChangeText={(v) => setForm({ ...form, lastName: v })}
          />
          <InputField
            label="Email Address"
            placeholder="your@email.com"
            textContentType="emailAddress"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
          />
          <InputField
            label="Password"
            placeholder="Create a password"
            secureTextEntry
            textContentType="newPassword"
            value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })}
          />

          <CustomButton
            title={loading ? "Creating Account..." : "Create Account"}
            onPress={onSignUpPress}
            disabled={loading}
            className="mt-4"
          />

          <OAuth />

          <Link
            href="/(auth)/sign-in"
            className="text-sm text-center text-neutral-500 mt-12 font-JakartaMedium"
          >
            Already have an account?{" "}
            <Text className="text-white font-JakartaBold">Sign In</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
