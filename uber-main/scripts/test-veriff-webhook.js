/**
 * Send a signed test payload to the Veriff webhook (local verification).
 *
 * Usage:
 *   $env:VERIFF_SHARED_SECRET="your-shared-secret"
 *   node scripts/test-veriff-webhook.js
 */
const crypto = require("crypto");

const WEBHOOK_URL =
  "https://gksfzvbfvnimrujrckwo.supabase.co/functions/v1/veriff-webhook";
const secret = process.env.VERIFF_SHARED_SECRET;

if (!secret) {
  console.error("Set VERIFF_SHARED_SECRET to sign the test payload.");
  process.exit(1);
}

const payload = {
  verification: {
    id: "00000000-0000-4000-8000-000000000099",
    status: "approved",
    code: 9001,
    vendorData: "00000000-0000-4000-8000-000000000001",
  },
};

const body = JSON.stringify(payload);
const signature = crypto
  .createHmac("sha256", secret)
  .update(body)
  .digest("hex");

fetch(WEBHOOK_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-hmac-signature": signature,
  },
  body,
})
  .then(async (res) => {
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  })
  .catch(console.error);
