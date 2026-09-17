import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
    message: "Submit your driver licence to begin automated verification.",
    icon: "document-text-outline",
    color: "#888",
  },
  processing: {
    title: "Verification In Progress",
    message: "We're verifying your licence with Veriff. This usually takes a few minutes.",
    icon: "hourglass-outline",
    color: "#1C6EF2",
  },
  verified: {
    title: "Licence Verified",
    message: "Your driver licence has been verified. You can now go online.",
    icon: "checkmark-circle",
    color: "#34C759",
  },
  rejected: {
    title: "Verification Declined",
    message: "Your licence could not be verified. Please upload clearer photos and try again.",
    icon: "close-circle",
    color: "#FF3B30",
  },
  expired: {
    title: "Session Expired",
    message: "Your verification session expired. Please submit again.",
    icon: "time-outline",
    color: "#FF9500",
  },
  failed: {
    title: "Verification Failed",
    message: "We couldn't complete verification. Check your images and try again.",
    icon: "alert-circle",
    color: "#FF9500",
  },
};

export function isVerificationComplete(status: DriverVerificationStatus): boolean {
  return ["verified", "rejected", "expired", "failed"].includes(status);
}

export function canDriverGoOnline(driver: DriverVerificationRecord | null): boolean {
  return !!driver?.is_verified && driver.verification_status === "verified";
}

/** Read a local image URI as base64 for Veriff upload. */
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
    return snap.data() as DriverVerificationRecord;
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
}): Promise<{ sessionId: string; status: string }> {
  const licenseFrontBase64 = await imageUriToBase64(params.licenseFrontUri);
  let licenseBackBase64: string | undefined;
  if (params.licenseBackUri) {
    licenseBackBase64 = await imageUriToBase64(params.licenseBackUri);
  }

  // Point to Firebase Cloud Function (HTTPS Trigger)
  const functionUrl = `https://us-central1-${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/veriffStartVerification`;
  
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      driverId: params.driverId,
      firstName: params.firstName,
      lastName: params.lastName,
      idNumber: params.idNumber,
      licenseNumber: params.licenseNumber,
      licenseExpiry: params.licenseExpiry,
      licenseFrontBase64,
      licenseBackBase64,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || "Failed to start verification via Firebase Functions");
  }
  return data;
}

export async function pollVeriffStatus(
  sessionId: string,
): Promise<{ status: DriverVerificationStatus; reason: string | null }> {
  // Point to Firebase Cloud Function (HTTPS Trigger)
  const functionUrl = `https://us-central1-${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/veriffPollStatus`;

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || "Failed to check verification status via Firebase Functions");
  }
  return {
    status: data.status as DriverVerificationStatus,
    reason: data.reason ?? null,
  };
}

export function subscribeToDriverVerification(
  driverId: string,
  onUpdate: (driver: DriverVerificationRecord) => void,
) {
  const docRef = doc(db, "drivers", driverId);
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as DriverVerificationRecord);
    }
  });

  return unsubscribe;
}
