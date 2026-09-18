import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as SMS from "expo-sms";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  StyleSheet,
} from "react-native";

import { supabase } from "@/lib/supabase";
import { useRideStore } from "@/store/rideStore";

const EmergencyButton = () => {
  const { matchedDriver, origin, userId } = useRideStore();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isEmergencyActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isEmergencyActive, pulseAnim]);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(recording);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setRecording(null);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    // In a real app, upload this URI to Supabase Storage
    console.log("Recording stopped and stored at", uri);
  };

  const triggerEmergency = async () => {
    Alert.alert(
      "EMERGENCY TRIGGER",
      "Are you sure you want to trigger an emergency alert? This will notify your contact and start recording.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "YES, I NEED HELP",
          style: "destructive",
          onPress: async () => {
            setIsEmergencyActive(true);
            await startRecording();

            // Send SMS to emergency contact (Mock number for now)
            const isAvailable = await SMS.isAvailableAsync();
            if (isAvailable) {
              await SMS.sendSMSAsync(
                ["0123456789"],
                `EMERGENCY: I am on a VARLIFE ride with ${matchedDriver?.name}. I don't feel safe. My location: https://maps.google.com/?q=${origin?.latitude},${origin?.longitude}`,
              );
            }

            // Log to Supabase
            try {
              await supabase.from("safety_logs").insert({
                user_id: userId,
                location_lat: origin?.latitude,
                location_lng: origin?.longitude,
                triggered_at: new Date().toISOString(),
              });
            } catch (e) {
              console.error("Safety log failed", e);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {isEmergencyActive && (
        <View style={styles.recordingPill}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingLabel}>Recording Active</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={isEmergencyActive ? stopRecording : triggerEmergency}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.emergencyBtn,
            isEmergencyActive
              ? styles.emergencyBtnActive
              : styles.emergencyBtnInactive,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Ionicons name="shield-checkmark" size={30} color="white" />
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.label}>
        {isEmergencyActive ? "Stop Recording" : "Safe Guard"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 128,
    right: 24,
    alignItems: "center",
  },
  recordingPill: {
    backgroundColor: "rgba(220,38,38,0.55)",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.8)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  recordingDot: {
    width: 7,
    height: 7,
    backgroundColor: "white",
    borderRadius: 4,
    marginRight: 6,
  },
  recordingLabel: {
    color: "white",
    fontFamily: "Jakarta-Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emergencyBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  emergencyBtnInactive: {
    backgroundColor: "rgba(220,38,38,0.75)",
    borderColor: "rgba(255,80,80,0.90)",
    shadowColor: "#dc2626",
  },
  emergencyBtnActive: {
    backgroundColor: "rgba(0,0,0,0.65)",
    borderColor: "rgba(220,38,38,0.90)",
    shadowColor: "#dc2626",
  },
  label: {
    color: "white",
    fontSize: 8,
    fontFamily: "Jakarta-Bold",
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    backgroundColor: "rgba(0,0,0,0.40)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});

export default EmergencyButton;
