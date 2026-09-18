const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY || "";

export default {
  expo: {
    name: "VARLIFE",
    slug: "varlife",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "varlife",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#000000",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.varlife.app",
      config: {
        googleMapsApiKey: mapsKey,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#000000",
      },
      package: "com.varlife.app",
      config: {
        googleMaps: {
          apiKey: mapsKey,
        },
      },
    },
    web: {
      bundler: "metro",
      output: "server",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      [
        "expo-router",
        {
          origin: "https://varlife.app/",
        },
      ],
      "expo-font",
      "expo-secure-store",
      "expo-location",
      "expo-notifications",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#000000",
          image: "./assets/images/splash.png",
          dark: {
            image: "./assets/images/splash.png",
            backgroundColor: "#000000",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};