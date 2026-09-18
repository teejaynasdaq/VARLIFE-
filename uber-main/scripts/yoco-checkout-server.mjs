/**
 * Local Yoco Checkout proxy for VARLIFE testing.
 *   set YOCO_SECRET_KEY=sk_test_xxx
 *   node scripts/yoco-checkout-server.mjs
 */
import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.YOCO_PORT || 8787);
const KEY = process.env.YOCO_SECRET_KEY;

if (!KEY) {
  console.error("Missing YOCO_SECRET_KEY (use a Yoco sk_test_... key)");
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  if (req.method !== "POST" || req.url !== "/checkout") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  let body = "";
  for await (const chunk of req) body += chunk;
  let payload;
  try {
    payload = JSON.parse(body || "{}");
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid JSON" }));
    return;
  }

  try {
    const yocoRes = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify({
        amount: payload.amount,
        currency: payload.currency || "ZAR",
        successUrl: payload.successUrl,
        cancelUrl: payload.cancelUrl,
        failureUrl: payload.failureUrl || payload.cancelUrl,
        metadata: payload.metadata || {},
      }),
    });
    const data = await yocoRes.json();
    res.writeHead(yocoRes.status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err?.message || err) }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Yoco checkout proxy on http://0.0.0.0:${PORT}/checkout`);
});