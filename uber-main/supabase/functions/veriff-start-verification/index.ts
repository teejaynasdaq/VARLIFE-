import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { getUserIdFromAuthHeader } from "./_shared/auth.ts";
import { getVeriffApiKey } from "./_shared/secrets.ts";
import {
  createVeriffSession,
  uploadVeriffMedia,
  submitVeriffSession,
} from "./_shared/veriff.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StartVerificationBody {
  driverId: string;
  firstName: string;
  lastName: string;
  idNumber?: string;
  licenseNumber: string;
  licenseExpiry?: string;
  licenseFrontBase64: string;
  licenseBackBase64?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = await getVeriffApiKey();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookUrl = `${supabaseUrl}/functions/v1/veriff-webhook`;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Verification service not configured" }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = getUserIdFromAuthHeader(authHeader);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: StartVerificationBody = await req.json();
    const {
      driverId,
      firstName,
      lastName,
      idNumber,
      licenseNumber,
      licenseExpiry,
      licenseFrontBase64,
      licenseBackBase64,
    } = body;

    if (!driverId || !licenseFrontBase64 || !licenseNumber) {
      return new Response(
        JSON.stringify({ error: "Missing required verification fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (driverId !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: existing } = await admin
      .from("drivers")
      .select("veriff_session_id, verification_status")
      .eq("id", driverId)
      .maybeSingle();

    if (
      existing?.verification_status === "processing" &&
      existing?.veriff_session_id
    ) {
      return new Response(
        JSON.stringify({
          sessionId: existing.veriff_session_id,
          status: "processing",
          message: "Verification already in progress",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sessionData = await createVeriffSession({
      apiKey,
      callbackUrl: webhookUrl,
      firstName,
      lastName,
      idNumber,
      vendorData: driverId,
      licenseNumber,
    });

    const sessionId = sessionData?.verification?.id || sessionData?.id;
    if (!sessionId) {
      throw new Error("No session ID returned from Veriff");
    }

    const stripBase64 = (s: string) =>
      s.replace(/^data:image\/\w+;base64,/, "");

    await uploadVeriffMedia({
      apiKey,
      sessionId,
      context: "document-front",
      base64Content: stripBase64(licenseFrontBase64),
    });

    if (licenseBackBase64) {
      await uploadVeriffMedia({
        apiKey,
        sessionId,
        context: "document-back",
        base64Content: stripBase64(licenseBackBase64),
      });
    }

    await submitVeriffSession({ apiKey, sessionId });

    const now = new Date().toISOString();
    const { error: updateError } = await admin
      .from("drivers")
      .update({
        veriff_session_id: sessionId,
        verification_provider: "veriff",
        verification_status: "processing",
        verification_started_at: now,
        verification_reference:
          sessionData?.verification?.vendorData ?? driverId,
        license_number: licenseNumber,
        license_expiry: licenseExpiry ?? null,
        id_number: idNumber ?? null,
        last_verification_update: now,
        updated_at: now,
      })
      .eq("id", driverId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        sessionId,
        status: "processing",
        message: "Verification submitted successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[veriff-start-verification]", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Verification failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
