const VERIFF_BASE = "https://stationapi.veriff.com";

export type VeriffDecisionStatus =
  | "approved"
  | "declined"
  | "resubmission_requested"
  | "expired"
  | "abandoned"
  | "submitted"
  | "review";

export function mapVeriffToAppStatus(
  veriffStatus: string,
  code?: number,
): string {
  const s = veriffStatus?.toLowerCase();
  if (s === "approved" || code === 9001) return "verified";
  if (s === "declined" || code === 9102) return "rejected";
  if (s === "resubmission_requested" || code === 9103) return "failed";
  if (s === "expired" || code === 9104) return "expired";
  if (s === "abandoned") return "failed";
  if (s === "submitted" || s === "review") return "processing";
  return "processing";
}

export async function veriffRequest(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    apiKey: string;
  },
): Promise<Response> {
  const url = `${VERIFF_BASE}${path}`;
  const headers: Record<string, string> = {
    "X-AUTH-CLIENT": options.apiKey,
    "Content-Type": "application/json",
  };

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      const res = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (res.status === 429 || res.status >= 500) {
        attempt++;
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 500 * attempt));
          continue;
        }
      }
      return res;
    } catch (err) {
      attempt++;
      if (attempt >= maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }

  throw new Error("Veriff request failed after retries");
}

export async function createVeriffSession(params: {
  apiKey: string;
  callbackUrl: string;
  firstName: string;
  lastName: string;
  idNumber?: string;
  vendorData: string;
  licenseNumber?: string;
}) {
  const res = await veriffRequest("/v1/sessions", {
    method: "POST",
    apiKey: params.apiKey,
    body: {
      verification: {
        callback: params.callbackUrl,
        person: {
          firstName: params.firstName,
          lastName: params.lastName,
          idNumber: params.idNumber,
        },
        document: {
          type: "DRIVERS_LICENSE",
          country: "ZA",
          number: params.licenseNumber,
        },
        vendorData: params.vendorData,
      },
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data?.message || data?.error || "Failed to create Veriff session",
    );
  }
  return data;
}

export async function uploadVeriffMedia(params: {
  apiKey: string;
  sessionId: string;
  context: "document-front" | "document-back" | "face";
  base64Content: string;
}) {
  const res = await veriffRequest(`/v1/sessions/${params.sessionId}/media`, {
    method: "POST",
    apiKey: params.apiKey,
    body: {
      image: {
        context: params.context,
        content: params.base64Content,
      },
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Failed to upload ${params.context}`);
  }
  return data;
}

export async function submitVeriffSession(params: {
  apiKey: string;
  sessionId: string;
}) {
  const res = await veriffRequest(`/v1/sessions/${params.sessionId}`, {
    method: "PATCH",
    apiKey: params.apiKey,
    body: { verification: { status: "submitted" } },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Failed to submit Veriff session");
  }
  return data;
}

export async function getVeriffDecision(params: {
  apiKey: string;
  sessionId: string;
}) {
  const res = await veriffRequest(`/v1/sessions/${params.sessionId}/decision`, {
    apiKey: params.apiKey,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Failed to fetch Veriff decision");
  }
  return data;
}

/** Validates Veriff webhook HMAC-SHA256 signature. */
export async function validateWebhookSignature(
  payload: string,
  signature: string | null,
  sharedSecret: string,
): Promise<boolean> {
  if (!signature || !sharedSecret) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sharedSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === signature.toLowerCase();
}
