import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { getVeriffSharedSecret } from "./_shared/secrets.ts";
import {
  mapVeriffToAppStatus,
  validateWebhookSignature,
} from "./_shared/veriff.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-hmac-signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-hmac-signature") ??
      req.headers.get("x-signature") ??
      req.headers.get("x-veriff-signature");
    const sharedSecret = (await getVeriffSharedSecret()) ?? "";

    if (sharedSecret) {
      const valid = await validateWebhookSignature(
        rawBody,
        signature,
        sharedSecret,
      );
      if (!valid) {
        console.warn("[veriff-webhook] Invalid signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const payload = JSON.parse(rawBody);
    const verification = payload?.verification ?? payload;
    const sessionId = verification?.id;
    const vendorData = verification?.vendorData;
    const veriffStatus = verification?.status ?? payload?.status;
    const code = verification?.code;
    const reason =
      verification?.reason ??
      verification?.declineReason ??
      payload?.reason ??
      null;

    if (!sessionId && !vendorData) {
      return new Response(JSON.stringify({ error: "Missing session data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const appStatus = mapVeriffToAppStatus(veriffStatus, code);
    const now = new Date().toISOString();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let query = admin.from("drivers").update({
      verification_status: appStatus,
      rejection_reason: appStatus === "verified" ? null : reason,
      verification_completed_at:
        appStatus === "verified" ||
        appStatus === "rejected" ||
        appStatus === "expired" ||
        appStatus === "failed"
          ? now
          : undefined,
      last_verification_update: now,
      updated_at: now,
    });

    if (sessionId) {
      query = query.eq("veriff_session_id", sessionId);
    } else {
      query = query.eq("id", vendorData);
    }

    const { error } = await query;
    if (error) {
      console.error("[veriff-webhook] DB update failed:", error.message);
      return new Response(JSON.stringify({ error: "Update failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (vendorData || sessionId) {
      const driverId = vendorData;
      if (driverId) {
        await admin.from("notifications").insert({
          user_id: driverId,
          title:
            appStatus === "verified"
              ? "License Verified"
              : "Verification Update",
          body:
            appStatus === "verified"
              ? "Your driver licence has been verified. You can now go online."
              : reason || `Verification status: ${appStatus}`,
          data: { type: "verification_update", status: appStatus },
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[veriff-webhook]", err);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
