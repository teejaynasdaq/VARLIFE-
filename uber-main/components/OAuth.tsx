import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import {
  Image,
  Text,
  View,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";

import { icons } from "@/constants";
import { useWarmUpBrowser } from "@/hooks/useWarmUpBrowser";
import { auth } from "@/lib/firebase";

WebBrowser.maybeCompleteAuthSession();

const OAuth = () => {
  useWarmUpBrowser();

  // Expo Auth Session Google Sign In hook setup
  const [request, , promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
    webClientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      "370761195543-tg70f9bd3r9h2sj5ig2vvh841dea1hb4.apps.googleusercontent.com",
    redirectUri: AuthSession.makeRedirectUri({
      scheme: "varlife",
      path: "oauth-callback",
    }),
  });

  const handleGoogleSignIn = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === "success") {
        const { id_token } = result.params;
        const credential = GoogleAuthProvider.credential(id_token);
        await signInWithCredential(auth, credential);
        router.replace("/(root)/(tabs)/home");
      }
    } catch (err: any) {
      console.error("[OAuth] Google Sign-In Error:", err);
      Alert.alert(
        "Google Sign-In Failed",
        err.message || "Could not authenticate with Google. Please try again.",
      );
    }
  };

  const handleAppleSignIn = async () => {
    try {
      // Apple Sign In requires native configuration; show a fallback message
      // until that's wired up for production builds.
      Alert.alert(
        "Apple Sign-In",
        "Not enabled yet. Use email/password for now.",
      );
    } catch (err: any) {
      console.error("[OAuth] Apple Sign-In Error:", err);
      Alert.alert(
        "Apple Sign-In Failed",
        err.message || "Could not authenticate with Apple. Please try again.",
      );
    }
  };

  return (
    <View className="w-full">
      <View className="flex flex-row justify-center items-center mt-12 mb-8 gap-x-3">
        <View className="flex-1 h-[0.5px] bg-neutral-900" />
        <Text className="text-[10px] font-JakartaBold text-neutral-600 uppercase tracking-[2px] px-2">
          Or continue with
        </Text>
        <View className="flex-1 h-[0.5px] bg-neutral-900" />
      </View>

      <View className="flex flex-row gap-x-4">
        {/* Google — glass */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          style={styles.oauthBtn}
          activeOpacity={0.74}
          disabled={!request}
        >
          <Image
            source={icons.google}
            resizeMode="contain"
            className="w-4 h-4 mr-3"
          />
          <Text style={styles.oauthBtnLabel}>Google</Text>
        </TouchableOpacity>

        {/* Apple — glass */}
        <TouchableOpacity
          onPress={handleAppleSignIn}
          style={styles.oauthBtn}
          activeOpacity={0.74}
        >
          <Ionicons
            name="logo-apple"
            size={18}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.oauthBtnLabel}>Apple</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  oauthBtn: {
    flex: 1,
    height: 60,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.18)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  oauthBtnLabel: {
    color: "#fff",
    fontFamily: "Jakarta-Bold",
    fontSize: 14,
  },
});

export default OAuth;
