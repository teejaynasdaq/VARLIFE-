/**
 * VARLIFE Production Migration Script
 * Run: node scripts/production-migration.js
 * Adds all missing tables, columns and seed data for full production readiness.
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

const migrations = [
  // ─── Users Table Extensions ───────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_student BOOLEAN DEFAULT false`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS student_email TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS student_verified_at TIMESTAMPTZ`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_rides INTEGER DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email'`,

  // ─── Drivers Table Extensions ─────────────────────────────────────────────
  `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active'`,
  `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS dob TEXT`,
  `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS id_number TEXT`,
  `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_number TEXT`,
  `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_expiry TEXT`,
  `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address TEXT`,
  `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS profile_image TEXT`,
  `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_pic_url TEXT`,
  `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS background_check_url TEXT`,

  // ─── Rides Table Extensions ───────────────────────────────────────────────
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS rider_rated_at TIMESTAMPTZ`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_rated_at TIMESTAMPTZ`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS cancellation_reason TEXT`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS cancelled_by TEXT`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2)`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS pickup_lat DECIMAL(10,7)`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS pickup_lng DECIMAL(10,7)`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS pickup_address TEXT`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS dropoff_lat DECIMAL(10,7)`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS dropoff_lng DECIMAL(10,7)`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS dropoff_address TEXT`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash'`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS ride_type TEXT DEFAULT 'VAR LIFE'`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS passenger_count INTEGER DEFAULT 1`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2)`,
  `ALTER TABLE rides ADD COLUMN IF NOT EXISTS duration_minutes INTEGER`,

  // ─── Ride Ratings Table ───────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS ride_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    rater_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rated_driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    rated_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    driver_rating INTEGER CHECK (driver_rating BETWEEN 1 AND 5),
    rider_rating INTEGER CHECK (rider_rating BETWEEN 1 AND 5),
    driver_review TEXT,
    rider_review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Student Offers Table ─────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS student_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    discount_percent INTEGER,
    discount_amount DECIMAL(10,2),
    partner_name TEXT NOT NULL,
    partner_logo_url TEXT,
    promo_code TEXT,
    expires_at TIMESTAMPTZ,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    max_redemptions INTEGER,
    redemption_count INTEGER DEFAULT 0,
    terms TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Student Saved Offers ─────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS student_saved_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES student_offers(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Student Redemptions ──────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS student_redemptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES student_offers(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    ride_id UUID REFERENCES rides(id) ON DELETE SET NULL
  )`,

  // ─── Notifications Table ──────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Messages Table (Ride Chat) ───────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ride_id TEXT NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Saved Locations ──────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS saved_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Lost Item Reports ────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS lost_item_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ─── Enable RLS on new tables ─────────────────────────────────────────────
  `ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE IF EXISTS ride_ratings ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE IF EXISTS student_offers ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE IF EXISTS student_saved_offers ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE IF EXISTS saved_locations ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE IF EXISTS lost_item_reports ENABLE ROW LEVEL SECURITY`,
];

// ─── Seed Student Offers ──────────────────────────────────────────────────
const sampleOffers = [
  {
    title: "20% Off Campus Rides",
    description:
      "Exclusive discount on rides between campus and student residences.",
    category: "rides",
    discount_percent: 20,
    partner_name: "VARLIFE",
    promo_code: "CAMPUS20",
    is_featured: true,
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    terms: "Valid on rides to/from registered campuses. Max 3 uses per day.",
  },
  {
    title: "Free Coffee at Bean Scene",
    description: "Buy one get one free on any hot beverage.",
    category: "coffee",
    discount_percent: 50,
    partner_name: "Bean Scene Coffee",
    promo_code: "BEANSTUDENT",
    is_featured: true,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    terms: "Valid Mon–Fri, 7am–12pm. Show student card at checkout.",
  },
  {
    title: "R50 Off Grocery Delivery",
    description: "R50 off your first Checkers Sixty60 order.",
    category: "grocery",
    discount_amount: 50,
    partner_name: "Checkers Sixty60",
    promo_code: "STUDENT50",
    is_featured: false,
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    terms: "First order only. Min order R150.",
  },
  {
    title: "15% Off Steers Burger",
    description: "15% student discount on all items.",
    category: "food",
    discount_percent: 15,
    partner_name: "Steers",
    promo_code: "STEERSSTUDENT",
    is_featured: false,
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    terms: "Present student card or app discount in-store.",
  },
  {
    title: "10% Off KFC",
    description: "Student discount on all KFC meals.",
    category: "food",
    discount_percent: 10,
    partner_name: "KFC",
    promo_code: "KFCSTUDENT",
    is_featured: false,
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    terms: "Valid at participating stores. Excludes combo deals.",
  },
  {
    title: "25% Off Cinema Tickets",
    description: "Quarter price off any movie at Nu Metro.",
    category: "entertainment",
    discount_percent: 25,
    partner_name: "Nu Metro",
    promo_code: "NUMETROSTUD",
    is_featured: true,
    expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    terms: "Valid Mon–Thu. Not applicable on premiere nights.",
  },
  {
    title: "Free Gym Day Pass",
    description: "One free day pass at Planet Fitness.",
    category: "campus",
    discount_percent: 100,
    partner_name: "Planet Fitness",
    promo_code: "FITNESSFREE",
    is_featured: false,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    max_redemptions: 1,
    terms: "One use per student. Must show student card.",
  },
  {
    title: "R30 Off Uber Eats",
    description: "R30 off your next Uber Eats order.",
    category: "food",
    discount_amount: 30,
    partner_name: "Uber Eats",
    promo_code: "EATSTUDENT",
    is_featured: false,
    expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    terms: "Min order R120. First order only.",
  },
  {
    title: "30% Off Books at Exclusive Books",
    description: "Student discount on all academic books.",
    category: "campus",
    discount_percent: 30,
    partner_name: "Exclusive Books",
    promo_code: "EXBOOKSTUD",
    is_featured: false,
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    terms: "Academic books only. Must show student card.",
  },
  {
    title: "Free Spotify Premium (3 Months)",
    description: "Get 3 months free Spotify Premium for students.",
    category: "entertainment",
    discount_percent: 100,
    partner_name: "Spotify",
    promo_code: "SPOTIFY3MO",
    is_featured: true,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    terms: "New accounts only. Requires .ac.za or .edu email.",
  },
  {
    title: "20% Off Vida e Caffè",
    description: "Student discount at Vida e Caffè.",
    category: "coffee",
    discount_percent: 20,
    partner_name: "Vida e Caffè",
    promo_code: "VIDASTUD",
    is_featured: false,
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    terms: "All beverages. Show app at counter.",
  },
  {
    title: "Late Night Ride Safety Discount",
    description: "30% off rides after 10pm for students.",
    category: "rides",
    discount_percent: 30,
    partner_name: "VARLIFE",
    promo_code: "SAFENIGHT",
    is_featured: true,
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    terms: "Valid 10pm–4am only. Campus area rides.",
  },
];

async function runMigrations() {
  console.log("🔧 Running VARLIFE production migrations...\n");

  for (const sql of migrations) {
    const label = sql.slice(0, 60).replace(/\n/g, " ") + "...";
    try {
      let res;
      try {
        res = await supabase.rpc("exec_sql", { sql_query: sql });
      } catch (err) {
        res = { error: err };
      }

      console.log(`  ✅ ${label}`);
    } catch (e) {
      console.warn(`  ⚠️  ${label}\n     ${e.message}`);
    }
  }

  console.log("\n🌱 Seeding student offers...");
  const existing = await supabase.from("student_offers").select("id").limit(1);
  if (!existing.data?.length) {
    const { error } = await supabase
      .from("student_offers")
      .insert(sampleOffers);
    if (error) {
      console.error("  ❌ Failed to seed offers:", error.message);
    } else {
      console.log(`  ✅ Seeded ${sampleOffers.length} student offers`);
    }
  } else {
    console.log("  ℹ️  Student offers already exist, skipping seed");
  }

  console.log("\n✅ Migration complete!\n");
}

runMigrations().catch(console.error);
