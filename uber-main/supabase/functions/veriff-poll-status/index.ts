import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { getUserIdFromAuthHeader } from "./_shared/auth.ts";
import { getVeriffApiKey } from "./_shared/secrets.ts";
import { getVeriffDecision, mapVeriffToAppStatus } from "./_shared/veriff.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = await getVeriffApiKey();
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userId = getUserIdFromAuthHeader(authHeader);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: driver } = await admin
      .from("drivers")
      .select("id, verification_status")
      .eq("id", userId)
      .eq("veriff_session_id", sessionId)
      .maybeSingle();

    if (!driver) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (driver.verification_status === "verified") {
      return new Response(JSON.stringify({ status: "verified" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const decision = await getVeriffDecision({ apiKey, sessionId });
    const verification = decision?.verification ?? decision;
    const appStatus = mapVeriffToAppStatus(
      verification?.status,
      verification?.code,
    );

    if (appStatus !== driver.verification_status) {
      const now = new Date().toISOString();
      await admin
        .from("drivers")
        .update({
          verification_status: appStatus,
          rejection_reason: verification?.reason ?? null,
          verification_completed_at: [
            "verified",
            "rejected",
            "expired",
            "failed",
          ].includes(appStatus)
            ? now
            : null,
          last_verification_update: now,
          updated_at: now,
        })
        .eq("id", userId);
    }

    return new Response(
      JSON.stringify({
        status: appStatus,
        reason: verification?.reason ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[veriff-poll-status]", err);
    return new Response(
      JSON.stringify({ error: "Failed to poll verification status" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
