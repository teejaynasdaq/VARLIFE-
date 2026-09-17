import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, View, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

import { auth } from "@/lib/firebase";
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { useAuth } from "@/context/AuthContext";

const SignIn = () => {
  const { enterGuestMode } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const onSignInPress = useCallback(async () => {
    if (!form.email || !form.password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
      router.replace("/(root)/(tabs)/home");
    } catch (err: any) {
      console.error("[SignIn]", err);
      Alert.alert(
        "Sign In Error",
        err.message || "Failed to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }, [form]);

  const handleSkip = useCallback(async () => {
    await enterGuestMode();
    router.replace("/(root)/(tabs)/home");
  }, [enterGuestMode]);

  const onForgotPassword = useCallback(async () => {
    if (!form.email) {
      Alert.alert(
        "Reset Password",
        "Enter your email address above, then tap Forgot Password."
      );
      return;
    }
    try {
      await sendPasswordResetEmail(auth, form.email.trim());
      Alert.alert(
        "Password Reset Sent",
        "Check your inbox for a password reset link."
      );
    } catch (err: any) {
      console.error("[ForgotPassword]", err);
      Alert.alert(
        "Error",
        err.message || "Could not send reset email. Please try again."
      );
    }
  }, [form.email]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView className="flex-1 bg-black" keyboardShouldPersistTaps="handled">
        <View className="flex-1 bg-black px-8 py-10 min-h-screen">
          <View className="flex flex-row justify-between items-center mt-10 mb-16">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-JakartaExtraBold tracking-[4px] absolute left-0 right-0 text-center -z-10">
              VARLIFE
            </Text>
            <TouchableOpacity onPress={handleSkip}>
              <Text className="text-neutral-500 text-sm font-JakartaMedium">
                Skip
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mb-12 items-center">
            <Text className="text-5xl text-white font-JakartaExtraBold mb-4 text-center">
              Welcome{"\n"}Back
            </Text>
            <Text className="text-neutral-500 text-sm font-JakartaMedium text-center leading-6 px-4">
              Sign in to continue your premium VARLIFE experience.
            </Text>
          </View>

          <View>
            <InputField
              label="Email Address"
              placeholder="Your email address"
              textContentType="emailAddress"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(value) => setForm({ ...form, email: value })}
            />

            <InputField
              label="Password"
              placeholder="Your password"
              secureTextEntry={true}
              textContentType="password"
              value={form.password}
              onChangeText={(value) => setForm({ ...form, password: value })}
            />

            <TouchableOpacity
              className="mb-8 items-end"
              onPress={onForgotPassword}
            >
              <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <CustomButton
              title={loading ? "Signing In..." : "Sign In"}
              onPress={onSignInPress}
              disabled={loading}
            />

            <OAuth />

            <Link
              href="/(auth)/sign-up"
              className="text-sm text-center text-neutral-500 mt-12 font-JakartaMedium"
            >
              Don't have an account?{" "}
              <Text className="text-white font-JakartaBold">Join Now</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignIn;
