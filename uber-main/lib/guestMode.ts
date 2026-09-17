import AsyncStorage from "@react-native-async-storage/async-storage";

export const GUEST_MODE_KEY = "varlife_guest_mode";

export const GUEST_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  clerk_id: null as string | null,
  is_guest: true,
  email: "guest@varlife.app",
  full_name: "Guest",
  first_name: "Guest",
  last_name: "",
  phone: null as string | null,
  profile_image_url: null as string | null,
  auth_provider: "guest",
  user_metadata: {
    full_name: "Guest",
    first_name: "Guest",
    last_name: "",
    avatar_url: null as string | null,
  },
};

export async function getGuestModeEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(GUEST_MODE_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export async function setGuestModeEnabled(enabled: boolean): Promise<void> {
  try {
    if (enabled) {
      await AsyncStorage.setItem(GUEST_MODE_KEY, "true");
    } else {
      await AsyncStorage.removeItem(GUEST_MODE_KEY);
    }
  } catch {
    // Non-fatal — guest mode still works for the current session
  }
}
