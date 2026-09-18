import * as WebBrowser from "expo-web-browser";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Yoco Checkout (test).
 * Secret key must NEVER ship in the app. Run:
 *   YOCO_SECRET_KEY=sk_test_... node scripts/yoco-checkout-server.mjs
 * and set EXPO_PUBLIC_YOCO_CHECKOUT_URL=http://YOUR_LAN_IP:8787/checkout
 */
const CHECKOUT_URL =
  process.env.EXPO_PUBLIC_YOCO_CHECKOUT_URL ||
  "http://127.0.0.1:8787/checkout";

export type YocoCheckoutResult = {
  checkoutId: string;
  redirectUrl: string;
  amountCents: number;
};

export async function createYocoCheckout(params: {
  amountZar: number;
  userId: string;
  rideId?: string;
  description?: string;
}): Promise<YocoCheckoutResult> {
  const amountCents = Math.max(200, Math.round(params.amountZar * 100));
  const successUrl = "https://varlife.app/payment/success";
  const cancelUrl = "https://varlife.app/payment/cancel";

  const res = await fetch(CHECKOUT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: amountCents,
      currency: "ZAR",
      successUrl,
      cancelUrl,
      failureUrl: cancelUrl,
      metadata: {
        userId: params.userId,
        rideId: params.rideId || "",
        description: params.description || "VARLIFE ride",
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data.error ||
        data.message ||
        "Yoco checkout failed. Is scripts/yoco-checkout-server.mjs running with YOCO_SECRET_KEY?",
    );
  }

  return {
    checkoutId: data.id || data.checkoutId,
    redirectUrl: data.redirectUrl,
    amountCents,
  };
}

export async function openYocoCheckout(redirectUrl: string) {
  return WebBrowser.openBrowserAsync(redirectUrl, {
    enableDefaultShareMenuItem: false,
  });
}

export async function recordYocoPaymentIntent(params: {
  userId: string;
  amountZar: number;
  checkoutId: string;
  rideId?: string;
}) {
  await addDoc(collection(db, "payments"), {
    user_id: params.userId,
    amount: params.amountZar,
    currency: "ZAR",
    provider: "yoco",
    checkout_id: params.checkoutId,
    ride_id: params.rideId || null,
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}