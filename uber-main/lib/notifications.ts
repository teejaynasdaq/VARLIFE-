import * as Device from "expo-device";
import { PermissionStatus, type PermissionResponse } from "expo-modules-core";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { supabase, clerkIdToUuid } from "@/lib/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(
  userId: string,
): Promise<string | null> {
  if (!Device.isDevice) return null;

  const existing =
    (await Notifications.getPermissionsAsync()) as PermissionResponse;
  let granted = existing.status === PermissionStatus.GRANTED;

  if (!granted) {
    const requested =
      (await Notifications.requestPermissionsAsync()) as PermissionResponse;
    granted = requested.status === PermissionStatus.GRANTED;
  }

  if (!granted) return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;
  const uuid = clerkIdToUuid(userId);

  await supabase.from("push_tokens").upsert(
    {
      user_id: uuid,
      token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,token" },
  );

  await supabase
    .from("users")
    .eq("id", uuid)
    .update({ push_token: token, updated_at: new Date().toISOString() });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("rides", {
      name: "Ride Updates",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token;
}

export async function createInAppNotification(params: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  const uuid = clerkIdToUuid(params.userId);
  await supabase.from("notifications").insert({
    user_id: uuid,
    title: params.title,
    body: params.body,
    data: params.data ?? null,
  });
}

export function addNotificationListeners(
  onReceived?: (notification: Notifications.Notification) => void,
  onResponse?: (response: Notifications.NotificationResponse) => void,
) {
  const receivedSub = Notifications.addNotificationReceivedListener((n) => {
    onReceived?.(n);
  });
  const responseSub = Notifications.addNotificationResponseReceivedListener(
    (r) => {
      onResponse?.(r);
    },
  );
  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

export async function notifyLocal(
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {}, sound: true },
    trigger: null,
  });
}

export const NOTIFICATION_TYPES = {
  RIDE_REQUEST: "ride_request",
  DRIVER_FOUND: "driver_found",
  RIDE_ACCEPTED: "ride_accepted",
  DRIVER_ARRIVED: "driver_arrived",
  RIDE_STARTED: "ride_started",
  RIDE_COMPLETED: "ride_completed",
  PAYMENT_CONFIRMED: "payment_confirmed",
  VERIFICATION_UPDATE: "verification_update",
  EARNINGS: "earnings",
} as const;
