import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const letterSpacingAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(letterSpacingAnim, {
        toValue: 4,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, letterSpacingAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.Text
          style={[styles.text, { letterSpacing: letterSpacingAnim }]}
        >
          VARLIFE
        </Animated.Text>
        <View style={styles.line} />
        <Text style={styles.tagline}>HANDCRAFTED LUXURY</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 42,
    fontFamily: "Jakarta-ExtraBold",
    textAlign: "center",
  },
  line: {
    width: 40,
    height: 1,
    backgroundColor: "#333333",
    marginVertical: 20,
  },
  tagline: {
    color: "#666666",
    fontSize: 10,
    fontFamily: "Jakarta-Bold",
    letterSpacing: 4,
  },
});

export default SplashScreen;
