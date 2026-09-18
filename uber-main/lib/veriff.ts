import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/** Set EXPO_PUBLIC_VERIFF_ENABLED=true in .env when Cloud Functions are ready for production. */
export const VERIFF_ENABLED =
  process.env.EXPO_PUBLIC_VERIFF_ENABLED === "true";

export type DriverVerificationStatus =
  | "pending"
  | "processing"
  | "verified"
  | "rejected"
  | "expired"
  | "failed";

export interface DriverVerificationRecord {
  id: string;
  veriff_session_id: string | null;
  verification_provider: string | null;
  verification_status: DriverVerificationStatus;
  is_verified: boolean;
  is_approved: boolean;
  verification_started_at: string | null;
  verification_completed_at: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  verification_reference: string | null;
  last_verification_update: string | null;
}

export const VERIFICATION_STATUS_LABELS: Record<
  DriverVerificationStatus,
  { title: string; message: string; icon: string; color: string }
> = {
  pending: {
    title: "Verification Required",
    message: VERIFF_ENABLED
      ? "Submit your driver licence to begin automated verification."
      : "Veriff is disabled for testing. You can go online after registration.",
    icon: "document-text-outline",
    color: "#888",
  },
  processing: {
    title: "Verification In Progress",
    message: "We're verifying your licence with Veriff. This usually takes a few minutes.",
    icon: "hourglass-outline",
    color: "#FFFFFF",
  },
  verified: {
    title: "Licence Verified",
    message: "Your driver licence has been verified. You can now go online.",
    icon: "checkmark-circle",
    color: "#34C759",
  },
  rejected: {
    title: "Verification Declined",
    message: "Please re-submit clearer licence photos.",
    icon: "close-circle",
    color: "#F56565",
  },
  expired: {
    title: "Verification Expired",
    message: "Please start verification again.",
    icon: "time-outline",
    color: "#888",
  },
  failed: {
    title: "Verification Failed",
    message: "Something went wrong. Please try again later.",
    icon: "alert-circle",
    color: "#F56565",
  },
};

export function isVerificationComplete(status: DriverVerificationStatus): boolean {
  return ["verified", "rejected", "expired", "failed"].includes(status);
}

export function canDriverGoOnline(driver: DriverVerificationRecord | null): boolean {
  if (!driver) return false;
  if (driver.verification_status === "rejected") return false;
  // Testing: Veriff off — allow online once a driver profile exists
  if (!VERIFF_ENABLED) return true;
  return !!driver.is_verified && driver.verification_status === "verified";
}

export async function imageUriToBase64(uri: string): Promise<string> {
  if (uri.startsWith("data:")) {
    const comma = uri.indexOf(",");
    return comma >= 0 ? uri.slice(comma + 1) : uri;
  }
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function getDriverVerification(
  driverId: string,
): Promise<DriverVerificationRecord | null> {
  try {
    const snap = await getDoc(doc(db, "drivers", driverId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as any) } as DriverVerificationRecord;
  } catch (err) {
    console.error("[getDriverVerification]", err);
    return null;
  }
}

export async function startVeriffVerification(params: {
  driverId: string;
  firstName: string;
  lastName: string;
  idNumber?: string;
  licenseNumber: string;
  licenseExpiry?: string;
  licenseFrontUri: string;
  licenseBackUri?: string;
}): Promise<{ sessionId: string; status: string; skipped?: boolean }> {
  // --- PRODUCTION VERIFF (commented out until Cloud Functions are ready) ---
  // const licenseFrontBase64 = await imageUriToBase64(params.licenseFrontUri);
  // let licenseBackBase64: string | undefined;
  // if (params.licenseBackUri) {
  //   licenseBackBase64 = await imageUriToBase64(params.licenseBackUri);
  // }
  // const functionUrl = `https://us-central1-${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/veriffStartVerification`;
  // const response = await fetch(functionUrl, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ ...params fields + base64 }),
  // });
  // const data = await response.json();
  // if (!response.ok || data.error) throw new Error(data.error || "Veriff start failed");
  // return data;

  if (VERIFF_ENABLED) {
    throw new Error(
      "Veriff is flagged enabled but Cloud Functions are not wired yet. Set EXPO_PUBLIC_VERIFF_ENABLED=false or deploy functions.",
    );
  }

  // Testing bypass: mark driver verified locally in Firestore
  const now = new Date().toISOString();
  await updateDoc(doc(db, "drivers", params.driverId), {
    is_verified: true,
    is_approved: true,
    verification_status: "verified",
    verification_provider: "manual_test_bypass",
    veriff_session_id: null,
    license_number: params.licenseNumber,
    verified_at: now,
    verification_completed_at: now,
    last_verification_update: now,
    updated_at: now,
  });

  return { sessionId: "test-bypass", status: "verified", skipped: true };
}

export async function pollVeriffStatus(
  sessionId: string,
): Promise<{ status: DriverVerificationStatus; reason: string | null }> {
  // --- PRODUCTION VERIFF (commented out until Cloud Functions are ready) ---
  // const functionUrl = `https://us-central1-${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/veriffPollStatus`;
  // const response = await fetch(functionUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) });
  // const data = await response.json();
  // if (!response.ok || data.error) throw new Error(data.error || "Veriff poll failed");
  // return { status: data.status, reason: data.reason ?? null };

  if (!VERIFF_ENABLED) {
    return { status: "verified", reason: null };
  }
  throw new Error("Veriff polling requires deployed Cloud Functions.");
}

export function subscribeToDriverVerification(
  driverId: string,
  onUpdate: (driver: DriverVerificationRecord) => void,
) {
  const docRef = doc(db, "drivers", driverId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate({ id: docSnap.id, ...(docSnap.data() as any) } as DriverVerificationRecord);
    }
  });
}
