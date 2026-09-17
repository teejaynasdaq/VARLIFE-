/**
 * Helper to print deploy payloads for Supabase MCP deploy_edge_function.
 * Usage: node scripts/deploy-mcp.js veriff-webhook
 */
const fs = require("fs");
const path = require("path");

const func = process.argv[2];
if (!func) {
  console.error("Usage: node scripts/deploy-mcp.js <function-name>");
  process.exit(1);
}

const payloadPath = path.join(__dirname, `deploy-${func}.json`);
const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
console.log(JSON.stringify(payload));
