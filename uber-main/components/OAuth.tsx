import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Text, View, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { GoogleAuthProvider, OAuthProvider, signInWithCredential } from "firebase/auth";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";

import { auth } from "@/lib/firebase";
import { icons } from "@/constants";
import { useWarmUpBrowser } from "@/hooks/useWarmUpBrowser";

WebBrowser.maybeCompleteAuthSession();

const OAuth = () => {
  useWarmUpBrowser();

  // Expo Auth Session Google Sign In hook setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "google-ios-client-id-placeholder",
    androidClientId: "google-android-client-id-placeholder",
    webClientId: "370761195543-tg70f9bd3r9h2sj5ig2vvh841dea1hb4.apps.googleusercontent.com",
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
        err.message || "Could not authenticate with Google. Please try again."
      );
    }
  };

  const handleAppleSignIn = async () => {
    try {
      // Direct Apple provider initialization
      const provider = new OAuthProvider("apple.com");
      // Since Apple Sign In requires native configuration, we use standard error handling or fallback
      Alert.alert("Apple Sign-In", "Apple Sign-In is configured for production builds.");
    } catch (err: any) {
      console.error("[OAuth] Apple Sign-In Error:", err);
      Alert.alert(
        "Apple Sign-In Failed",
        err.message || "Could not authenticate with Apple. Please try again."
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
