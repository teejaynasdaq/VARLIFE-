import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { notifyLocal } from "@/lib/notifications";
import {
  DriverVerificationRecord,
  DriverVerificationStatus,
  VERIFICATION_STATUS_LABELS,
  getDriverVerification,
  pollVeriffStatus,
  subscribeToDriverVerification,
} from "@/lib/veriff";

const POLL_INTERVAL_MS = 15000;

export default function DriverVerificationScreen() {
  const { user } = useAuth();
  const [verification, setVerification] =
    useState<DriverVerificationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadVerification = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await getDriverVerification(user.id);
    setVerification(data);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadVerification();
  }, [loadVerification]);

  useEffect(() => {
    if (!user?.id) return;
    return subscribeToDriverVerification(user.id, (updated) => {
      setVerification(updated);
      if (updated.verification_status === "verified") {
        notifyLocal(
          "Licence Verified",
          "You can now complete onboarding and go online.",
        );
      }
    });
  }, [user?.id]);

  useEffect(() => {
    if (
      !verification?.veriff_session_id ||
      verification.verification_status !== "processing"
    ) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    const poll = async () => {
      if (polling || !verification.veriff_session_id) return;
      setPolling(true);
      try {
        const result = await pollVeriffStatus(verification.veriff_session_id);
        setVerification((prev) =>
          prev
            ? {
                ...prev,
                verification_status: result.status,
                rejection_reason: result.reason,
              }
            : prev,
        );
      } catch {
        // Silent — webhook may update first
      } finally {
        setPolling(false);
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [
    verification?.veriff_session_id,
    verification?.verification_status,
    polling,
  ]);

  const status: DriverVerificationStatus =
    verification?.verification_status ?? "pending";
  const meta = VERIFICATION_STATUS_LABELS[status];

  const handleContinue = () => {
    if (status === "verified") {
      router.replace("/(driver)/driver-home");
    } else if (["rejected", "expired", "failed"].includes(status)) {
      router.replace("/(driver)/driver-register");
    }
  };

  const handleRetry = () => {
    Alert.alert(
      "Retry Verification",
      "You'll return to registration to upload new licence photos.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => router.replace("/(driver)/driver-register"),
        },
      ],
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#1C6EF2" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-5 pt-2 flex-row items-center mb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-JakartaExtraBold">
          Licence Verification
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="items-center mt-8 mb-10">
          <View
            className="w-28 h-28 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: `${meta.color}22` }}
          >
            <Ionicons name={meta.icon as any} size={56} color={meta.color} />
          </View>
          <Text className="text-white text-2xl font-JakartaExtraBold text-center">
            {meta.title}
          </Text>
          <Text className="text-neutral-400 text-base font-JakartaMedium text-center mt-4 px-4 leading-6">
            {meta.message}
          </Text>
          {verification?.rejection_reason ? (
            <View className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mt-6 w-full">
              <Text className="text-neutral-500 text-xs font-JakartaBold uppercase tracking-widest mb-2">
                Reason
              </Text>
              <Text className="text-white font-JakartaMedium text-sm">
                {verification.rejection_reason}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="bg-neutral-900 rounded-2xl p-5 border border-neutral-800 mb-6">
          <StatusRow
            label="Provider"
            value={verification?.verification_provider ?? "Veriff"}
          />
          <StatusRow
            label="Status"
            value={status.toUpperCase()}
            highlight={meta.color}
          />
          {verification?.veriff_session_id ? (
            <StatusRow
              label="Reference"
              value={verification.veriff_session_id.slice(0, 12) + "…"}
            />
          ) : null}
          {verification?.verification_started_at ? (
            <StatusRow
              label="Started"
              value={new Date(
                verification.verification_started_at,
              ).toLocaleString()}
            />
          ) : null}
          {verification?.verified_at ? (
            <StatusRow
              label="Verified"
              value={new Date(verification.verified_at).toLocaleString()}
            />
          ) : null}
        </View>

        {status === "processing" && (
          <View className="flex-row items-center justify-center py-4">
            <ActivityIndicator color="#1C6EF2" size="small" />
            <Text className="text-neutral-500 font-JakartaMedium ml-3 text-sm">
              Checking verification status…
            </Text>
          </View>
        )}

        {status === "verified" && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnBlue]}
            activeOpacity={0.76}
            onPress={handleContinue}
          >
            <Text style={styles.actionBtnLabel}>Continue to Driver Mode</Text>
          </TouchableOpacity>
        )}

        {["rejected", "expired", "failed"].includes(status) && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnWhite]}
            activeOpacity={0.76}
            onPress={handleRetry}
          >
            <Text style={[styles.actionBtnLabel, { color: "#000" }]}>
              Retry Verification
            </Text>
          </TouchableOpacity>
        )}

        {status === "pending" && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnBlue]}
            activeOpacity={0.76}
            onPress={() => router.replace("/(driver)/driver-register")}
          >
            <Text style={styles.actionBtnLabel}>Complete Registration</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  return (
    <View className="flex-row justify-between py-3 border-b border-neutral-800">
      <Text className="text-neutral-500 font-JakartaMedium text-sm">
        {label}
      </Text>
      <Text
        className="font-JakartaBold text-sm"
        style={{ color: highlight ?? "white" }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 1.3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },
  actionBtnBlue: {
    backgroundColor: "rgba(28,110,242,0.22)",
    borderColor: "rgba(28,110,242,0.55)",
    shadowColor: "#1C6EF2",
  },
  actionBtnWhite: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#fff",
  },
  actionBtnLabel: {
    color: "#fff",
    fontFamily: "Jakarta-Bold",
    fontSize: 17,
  },
});
