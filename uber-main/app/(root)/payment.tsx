import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { getPaymentHistory } from "@/lib/supabase";

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: "cash-outline", active: true },
  { id: "card", label: "Card", icon: "card-outline", active: false },
  { id: "apple", label: "Apple Pay", icon: "logo-apple", active: false },
  {
    id: "wallet",
    label: "VARLIFE Wallet",
    icon: "wallet-outline",
    active: false,
  },
];

export default function PaymentScreen() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState("cash");

  const loadPayments = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const history = await getPaymentHistory(user.clerk_id ?? user.id);
      setPayments(history);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const totalSpent = payments
    .filter((p) => p.status === "SUCCESS" || p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-5 pt-2 flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-JakartaExtraBold">
          Cards & Wallets
        </Text>
      </View>

      <ScrollView
        className="px-5"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="bg-dark-100/90 p-6 rounded-[32px] border border-white/5 mb-8">
          <Text className="text-neutral-500 text-[10px] font-JakartaBold uppercase tracking-widest mb-2">
            Total Spent
          </Text>
          <Text className="text-white text-4xl font-JakartaExtraBold">
            R{totalSpent.toFixed(2)}
          </Text>
          <Text className="text-neutral-600 text-xs font-JakartaMedium mt-2">
            {payments.length} transactions
          </Text>
        </View>

        <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-4">
          Payment Methods
        </Text>
        <View className="bg-dark-100/90 rounded-[32px] border border-white/5 mb-8 overflow-hidden">
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              className="flex-row items-center justify-between px-5 py-5 border-b border-white/5"
              onPress={() => {
                if (!method.active && method.id !== "cash") {
                  Alert.alert(
                    "Coming Soon",
                    `${method.label} will be available in a future update.`,
                  );
                  return;
                }
                setSelectedMethod(method.id);
              }}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center mr-4">
                  <Ionicons name={method.icon as any} size={20} color="white" />
                </View>
                <Text className="text-white font-JakartaMedium">
                  {method.label}
                </Text>
              </View>
              {selectedMethod === method.id ? (
                <Ionicons name="checkmark-circle" size={22} color="white" />
              ) : (
                <Ionicons name="ellipse-outline" size={22} color="#444" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-neutral-600 text-[10px] font-JakartaBold uppercase tracking-widest mb-4">
          Transaction History
        </Text>
        {loading ? (
          <ActivityIndicator color="white" className="mt-6" />
        ) : payments.length === 0 ? (
          <View className="bg-dark-100/90 p-8 rounded-[32px] border border-white/5 items-center">
            <Ionicons name="receipt-outline" size={40} color="#333" />
            <Text className="text-neutral-500 font-JakartaMedium mt-4 text-center">
              No transactions yet. Your ride payments will appear here.
            </Text>
          </View>
        ) : (
          payments.map((payment) => (
            <View
              key={payment.id}
              className="bg-dark-100/90 p-5 rounded-2xl border border-white/5 mb-3"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-3">
                  <Text
                    className="text-white font-JakartaBold"
                    numberOfLines={1}
                  >
                    {payment.rides?.dropoff_address ?? "Ride payment"}
                  </Text>
                  <Text className="text-neutral-500 text-xs mt-1">
                    {new Date(payment.created_at).toLocaleDateString()} •{" "}
                    {payment.status}
                  </Text>
                </View>
                <Text className="text-white font-JakartaBold">
                  R{Number(payment.amount ?? 0).toFixed(2)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
