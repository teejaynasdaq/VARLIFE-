import { createClient } from "jsr:@supabase/supabase-js@2";

const cache = new Map<string, string>();

/** Read secret from edge env first, then Supabase Vault via service role. */
export async function getAppSecret(name: string): Promise<string | null> {
  const fromEnv = Deno.env.get(name);
  if (fromEnv) return fromEnv;

  if (cache.has(name)) return cache.get(name)!;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return null;

  const admin = createClient(supabaseUrl, serviceKey);
  const { data, error } = await admin.rpc("get_app_secret", {
    secret_name: name,
  });

  if (error || !data) {
    console.warn(`[secrets] Failed to load ${name}:`, error?.message);
    return null;
  }

  cache.set(name, data);
  return data;
}

export async function getVeriffApiKey(): Promise<string | null> {
  return getAppSecret("VERIFF_API_KEY");
}

export async function getVeriffSharedSecret(): Promise<string | null> {
  return getAppSecret("VERIFF_SHARED_SECRET");
}
