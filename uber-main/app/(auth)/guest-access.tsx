import { router } from "expo-router";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import { icons, images } from "@/constants";

const GuestAccess = () => {
  const handleContinueAsGuest = () => {
    Alert.alert(
      "Continue as Guest",
      "You can explore the app, but student discounts require verification.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          onPress: () => router.replace("/(root)/(tabs)/home"),
        },
      ],
    );
  };

  const handleEmailSignIn = () => {
    Alert.alert(
      "Email Sign In",
      "Email authentication is not configured for development. Continue as guest to explore the app.",
      [
        {
          text: "OK",
          onPress: handleContinueAsGuest,
        },
      ],
    );
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      "Google Sign In",
      "Google authentication is not configured for development. Continue as guest to explore the app.",
      [
        {
          text: "OK",
          onPress: handleContinueAsGuest,
        },
      ],
    );
  };

  const handleAppleSignIn = () => {
    Alert.alert(
      "Apple Sign In",
      "Apple authentication is not configured for development. Continue as guest to explore the app.",
      [
        {
          text: "OK",
          onPress: handleContinueAsGuest,
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-5 justify-center">
          <View className="items-center mb-10">
            <Image
              source={images.getStarted}
              className="w-40 h-40"
              resizeMode="contain"
            />
            <Text className="text-2xl font-JakartaBold mt-5">Guest Access</Text>
            <Text className="text-gray-500 font-JakartaMedium text-center mt-2">
              Sign in to explore rides and features.
            </Text>
          </View>

          <View className="space-y-4">
            <CustomButton
              title="Continue with Email"
              onPress={handleEmailSignIn}
              className="w-full bg-black"
              textVariant="default"
              IconLeft={() => (
                <Image
                  source={icons.email}
                  className="w-5 h-5 mr-2"
                  tintColor="white"
                />
              )}
            />
            <CustomButton
              title="Continue with Google"
              onPress={handleGoogleSignIn}
              className="w-full bg-white border border-gray-200"
              textVariant="primary"
              IconLeft={() => (
                <Image source={icons.google} className="w-5 h-5 mr-2" />
              )}
            />
            <CustomButton
              title="Continue with Apple"
              onPress={handleAppleSignIn}
              className="w-full bg-white border border-gray-200"
              textVariant="primary"
              IconLeft={() => (
                <Image
                  source={icons.person}
                  className="w-5 h-5 mr-2"
                  tintColor="black"
                />
              )}
            />
            <CustomButton
              title="Continue as Guest"
              onPress={handleContinueAsGuest}
              className="w-full bg-secondary-500"
              textVariant="default"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GuestAccess;
