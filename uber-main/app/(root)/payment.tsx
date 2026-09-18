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
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { getPaymentHistory } from "@/lib/supabase";
import {
  createYocoCheckout,
  openYocoCheckout,
  recordYocoPaymentIntent,
} from "@/lib/yoco";

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
  const [testAmount, setTestAmount] = useState("50");
  const [paying, setPaying] = useState(false);

  const loadPayments = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const history = await getPaymentHistory(user.id);
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

  const payWithYoco = async () => {
    if (!user?.id) return;
    const amountZar = Number(testAmount);
    if (!Number.isFinite(amountZar) || amountZar < 2) {
      Alert.alert("Amount", "Enter at least R2.00 for a Yoco test checkout.");
      return;
    }
    setPaying(true);
    try {
      const checkout = await createYocoCheckout({
        amountZar,
        userId: user.id,
        description: "VARLIFE test payment",
      });
      await recordYocoPaymentIntent({
        userId: user.id,
        amountZar,
        checkoutId: checkout.checkoutId,
      });
      await openYocoCheckout(checkout.redirectUrl);
      await loadPayments();
      Alert.alert(
        "Yoco opened",
        "Complete the test card payment in the browser. In production, confirm via Yoco webhooks.",
      );
    } catch (err: any) {
      Alert.alert(
        "Yoco unavailable",
        err?.message ||
          "Start: YOCO_SECRET_KEY=sk_test_... node scripts/yoco-checkout-server.mjs",
      );
    } finally {
      setPaying(false);
    }
  };
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
                if (!method.active) {
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

        {selectedMethod === "yoco" ? (
          <View className="bg-dark-100/90 p-5 rounded-[32px] border border-white/5 mb-8">
            <Text className="text-white font-JakartaBold mb-2">
              Test Yoco checkout
            </Text>
            <Text className="text-neutral-500 text-xs font-JakartaMedium mb-4 leading-5">
              Uses your Yoco sk_test key via the local proxy. Never put the
              secret in the app.
            </Text>
            <TextInput
              value={testAmount}
              onChangeText={setTestAmount}
              keyboardType="decimal-pad"
              placeholder="50.00"
              placeholderTextColor="#555"
              className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-4 text-white font-JakartaMedium mb-4"
            />
            <TouchableOpacity
              className={`w-full py-4 rounded-full items-center ${paying ? "bg-neutral-800" : "bg-white"}`}
              onPress={payWithYoco}
              disabled={paying}
            >
              {paying ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text className="text-black font-JakartaBold text-base">
                  Pay with Yoco
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
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
