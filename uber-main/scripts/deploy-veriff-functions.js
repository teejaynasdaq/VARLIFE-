/**
 * Deploy Veriff edge functions to Supabase.
 * Requires: npx supabase login  (once)
 *
 * Usage:
 *   node scripts/deploy-veriff-functions.js
 */
const { execSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const projectRef = "gksfzvbfvnimrujrckwo";
const functions = [
  "veriff-webhook",
  "veriff-start-verification",
  "veriff-poll-status",
];

console.log("Deploying Veriff edge functions to", projectRef);

try {
  execSync(
    `npx supabase functions deploy ${functions.join(" ")} --project-ref ${projectRef}`,
    { cwd: root, stdio: "inherit", env: process.env },
  );
  console.log("\nDeploy complete.");
} catch (err) {
  console.error("\nDeploy failed. Run `npx supabase login` first, then retry.");
  process.exit(1);
}
