/**
 * Store Veriff credentials in Supabase Vault + optional edge function secrets.
 *
 * Usage (PowerShell):
 *   $env:VERIFF_API_KEY="your-api-key"
 *   $env:VERIFF_SHARED_SECRET="your-shared-secret"
 *   node scripts/setup-veriff-secrets.js
 *
 * Never commit real keys to source control.
 */
require("dotenv").config();
const postgres = require("postgres");

const API_KEY = process.env.VERIFF_API_KEY;
const SHARED_SECRET = process.env.VERIFF_SHARED_SECRET;

if (!API_KEY || !SHARED_SECRET) {
  console.error(
    "Missing VERIFF_API_KEY or VERIFF_SHARED_SECRET environment variables.",
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function upsertVaultSecret(name, value, description) {
  const existing = await sql`
    SELECT id FROM vault.secrets WHERE name = ${name} LIMIT 1
  `;

  if (existing.length > 0) {
    await sql`
      SELECT vault.update_secret(
        ${existing[0].id}::uuid,
        ${value},
        ${name},
        ${description}
      )
    `;
    console.log(`Updated vault secret: ${name}`);
  } else {
    await sql`
      SELECT vault.create_secret(${value}, ${name}, ${description})
    `;
    console.log(`Created vault secret: ${name}`);
  }
}

async function ensureSecretHelper() {
  await sql`
    CREATE OR REPLACE FUNCTION public.get_app_secret(secret_name text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, vault
    AS $$
    DECLARE
      result text;
    BEGIN
      SELECT decrypted_secret INTO result
      FROM vault.decrypted_secrets
      WHERE name = secret_name
      LIMIT 1;
      RETURN result;
    END;
    $$;
  `;
  await sql`REVOKE ALL ON FUNCTION public.get_app_secret(text) FROM PUBLIC`;
  await sql`GRANT EXECUTE ON FUNCTION public.get_app_secret(text) TO service_role`;
  console.log("Ensured get_app_secret() helper function");
}

async function verifySecrets() {
  const rows = await sql`
    SELECT public.get_app_secret('VERIFF_API_KEY') IS NOT NULL AS has_api_key,
           public.get_app_secret('VERIFF_SHARED_SECRET') IS NOT NULL AS has_shared_secret
  `;
  console.log("Vault verification:", rows[0]);
}

async function main() {
  try {
    await ensureSecretHelper();
    await upsertVaultSecret(
      "VERIFF_API_KEY",
      API_KEY,
      "Veriff Station API key for driver licence verification",
    );
    await upsertVaultSecret(
      "VERIFF_SHARED_SECRET",
      SHARED_SECRET,
      "Veriff webhook HMAC shared secret",
    );
    await verifySecrets();
    console.log(
      "\nDone. Redeploy edge functions so they pick up vault fallback:",
    );
    console.log("  npx supabase login");
    console.log(
      "  npx supabase secrets set VERIFF_API_KEY=... VERIFF_SHARED_SECRET=... --project-ref gksfzvbfvnimrujrckwo",
    );
    console.log(
      "  npx supabase functions deploy veriff-webhook veriff-start-verification veriff-poll-status --project-ref gksfzvbfvnimrujrckwo",
    );
    console.log("\nVeriff webhook URL:");
    console.log(
      "  https://gksfzvbfvnimrujrckwo.supabase.co/functions/v1/veriff-webhook",
    );
  } catch (err) {
    console.error("Setup failed:", err.message || err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
