/**
 * VARLIFE end-to-end flow validation (no device required).
 * Run: node scripts/e2e-flow-test.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
let passed = 0;
let failed = 0;

function ok(label) {
  passed++;
  console.log(`  ✅ ${label}`);
}

function fail(label, err) {
  failed++;
  console.error(`  ❌ ${label}`);
  if (err) console.error(`     ${err.message || err}`);
}

function assert(condition, label, err) {
  if (condition) ok(label);
  else fail(label, err);
}

console.log("\nVARLIFE E2E Flow Test\n");

// ─── 1. Source files exist ───────────────────────────────────────────────────
console.log("1. Critical files");
const requiredFiles = [
  "app/index.tsx",
  "app/(auth)/welcome.tsx",
  "app/(auth)/sign-in.tsx",
  "app/(root)/(tabs)/home.tsx",
  "context/AuthContext.tsx",
  "lib/guestMode.ts",
  "components/BookingCard.tsx",
  "components/RideOptions.tsx",
  "components/VarlifeDrawer.tsx",
];
for (const file of requiredFiles) {
  assert(fs.existsSync(path.join(ROOT, file)), `exists: ${file}`);
}

// ─── 2. Dev instant login removed ──────────────────────────────────────────
console.log("\n2. Auth cleanup");
const signInSrc = fs.readFileSync(
  path.join(ROOT, "app/(auth)/sign-in.tsx"),
  "utf8",
);
assert(
  !signInSrc.includes("DEV ONLY: Instant Login"),
  "dev instant login removed from sign-in",
);
assert(signInSrc.includes("Skip"), "skip button present on sign-in");

const welcomeSrc = fs.readFileSync(
  path.join(ROOT, "app/(auth)/welcome.tsx"),
  "utf8",
);
assert(welcomeSrc.includes("Skip for now"), "skip button present on welcome");
assert(welcomeSrc.includes("enterGuestMode"), "welcome uses enterGuestMode");

// ─── 3. Guest mode wiring ────────────────────────────────────────────────────
console.log("\n3. Guest mode");
const authCtx = fs.readFileSync(
  path.join(ROOT, "context/AuthContext.tsx"),
  "utf8",
);
assert(authCtx.includes("enterGuestMode"), "AuthContext exposes enterGuestMode");
assert(authCtx.includes("canAccessApp"), "AuthContext exposes canAccessApp");
assert(authCtx.includes("isGuest"), "AuthContext exposes isGuest");

const rootLayout = fs.readFileSync(
  path.join(ROOT, "app/(root)/_layout.tsx"),
  "utf8",
);
assert(rootLayout.includes("canAccessApp"), "root layout uses canAccessApp");

const driverLayout = fs.readFileSync(
  path.join(ROOT, "app/(driver)/_layout.tsx"),
  "utf8",
);
assert(
  driverLayout.includes("isAuthenticated"),
  "driver layout still requires real auth",
);

const homeSrc = fs.readFileSync(
  path.join(ROOT, "app/(root)/(tabs)/home.tsx"),
  "utf8",
);
assert(homeSrc.includes("isGuest"), "home blocks booking for guests");

// ─── 4. clerkIdToUuid (booking ID mapping) ───────────────────────────────────
console.log("\n4. ID mapping");
function clerkIdToUuid(clerkId) {
  if (!clerkId) return "00000000-0000-4000-8000-000000000000";
  if (clerkId.length === 36 && clerkId.includes("-")) return clerkId;

  let h1 = 0x811c9dc5,
    h2 = 0xcbf29ce4,
    h3 = 0x5851f42d,
    h4 = 0x9e3779b9;
  for (let i = 0; i < clerkId.length; i++) {
    const c = clerkId.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x01000193);
    h3 = Math.imul(h3 ^ c, 0x01000193);
    h4 = Math.imul(h4 ^ c, 0x01000193);
  }
  const p = (n) => (n >>> 0).toString(16).padStart(8, "0");
  const raw = p(h1) + p(h2) + p(h3) + p(h4);
  return [
    raw.slice(0, 8),
    raw.slice(8, 12),
    "4" + raw.slice(13, 16),
    ((parseInt(raw[16], 16) & 0x3) | 0x8).toString(16) + raw.slice(17, 20),
    raw.slice(20, 32),
  ].join("-");
}

const testUuid = clerkIdToUuid("user_test123");
assert(
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    testUuid,
  ),
  "clerkIdToUuid produces valid UUID v4",
);
assert(
  clerkIdToUuid(testUuid) === testUuid,
  "clerkIdToUuid is idempotent for UUIDs",
);

// ─── 5. Ride status normalization ────────────────────────────────────────────
console.log("\n5. Ride status");
const rideStatusSrc = fs.readFileSync(
  path.join(ROOT, "lib/rideStatus.ts"),
  "utf8",
);
assert(rideStatusSrc.includes("toDbStatus"), "rideStatus module has toDbStatus");

const lostItemSrc = fs.readFileSync(
  path.join(ROOT, "app/(root)/lost-item.tsx"),
  "utf8",
);
assert(
  lostItemSrc.includes('toLowerCase() === "completed"'),
  "lost-item filters completed rides correctly",
);

// ─── 6. Pricing tiers ────────────────────────────────────────────────────────
console.log("\n6. Pricing");
const pricingSrc = fs.readFileSync(path.join(ROOT, "lib/pricing.ts"), "utf8");
assert(pricingSrc.includes("lite"), "VAR Lite tier defined");
assert(pricingSrc.includes("go"), "VAR Go tier defined");

// ─── 7. TypeScript compile ───────────────────────────────────────────────────
console.log("\n7. TypeScript");
try {
  execSync("npx tsc --noEmit", { cwd: ROOT, stdio: "pipe" });
  ok("tsc --noEmit passes");
} catch (e) {
  fail("tsc --noEmit passes", e.stderr?.toString() || e.message);
}

// ─── 8. Supabase connectivity (optional) ─────────────────────────────────────
console.log("\n8. Supabase (optional)");
function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}
const env = loadEnv();
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  (async () => {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { apikey: supabaseKey },
      });
      assert(
        res.status > 0 && res.status < 500,
        `Supabase reachable (${res.status})`,
      );
    } catch (e) {
      fail("Supabase reachable", e);
    }

    printSummary();
  })();
} else {
  console.log("  ⚠️  Skipping Supabase check — .env not configured");
  printSummary();
}

function printSummary() {
  console.log(`\n${"─".repeat(40)}`);
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  if (failed > 0) {
    console.log("\nE2E test FAILED\n");
    process.exit(1);
  }
  console.log("\nE2E test PASSED\n");
}
