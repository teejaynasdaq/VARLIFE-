/**
 * VARLIFE Database Wipe & Rebuild Script
 * Run: node scripts/wipe_and_rebuild_db.js
 * DANGER: This will permanently delete all data in the database.
 */

require("dotenv").config();
const postgres = require("postgres");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const sql = postgres(connectionString);

async function wipeAndRebuild() {
  try {
    console.log("⚠️ DANGER: Wiping public schema completely... ⚠️");

    // 1. Drop and recreate the public schema to ensure a completely clean slate
    await sql`DROP SCHEMA public CASCADE;`;
    await sql`CREATE SCHEMA public;`;
    await sql`GRANT ALL ON SCHEMA public TO postgres;`;
    await sql`GRANT ALL ON SCHEMA public TO public;`;

    console.log("✅ Public schema wiped and recreated.");

    // 2. Create exact schema based on app models
    console.log("🏗️ Rebuilding tables...");

    // USERS
    await sql`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        profile_image_url TEXT,
        auth_provider TEXT DEFAULT 'email',
        role VARCHAR(50) DEFAULT 'rider',
        is_student BOOLEAN DEFAULT false,
        student_email TEXT,
        student_verified_at TIMESTAMPTZ,
        rating DECIMAL(3,2) DEFAULT 5.0,
        total_rides INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("✅ Created users table.");

    // DRIVERS
    await sql`
      CREATE TABLE drivers (
        id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        account_status TEXT DEFAULT 'active',
        dob TEXT,
        id_number TEXT UNIQUE,
        license_number TEXT UNIQUE,
        license_expiry TEXT,
        address TEXT,
        profile_image TEXT,
        license_pic_url TEXT,
        background_check_url TEXT,
        vehicle_registration TEXT,
        vehicle_model TEXT,
        is_approved BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("✅ Created drivers table.");

    // RIDES
    await sql`
      CREATE TABLE rides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rider_id UUID REFERENCES users(id),
        driver_id UUID REFERENCES drivers(id),
        status TEXT DEFAULT 'requested',
        payment_method TEXT DEFAULT 'cash',
        ride_type TEXT DEFAULT 'VAR LIFE',
        passenger_count INTEGER DEFAULT 1,
        distance_km DECIMAL(10,2),
        duration_minutes INTEGER,
        final_price DECIMAL(10,2),
        
        pickup_address TEXT,
        pickup_lat DECIMAL(10,7),
        pickup_lng DECIMAL(10,7),
        
        dropoff_address TEXT,
        dropoff_lat DECIMAL(10,7),
        dropoff_lng DECIMAL(10,7),
        
        cancellation_reason TEXT,
        cancelled_by TEXT,
        
        requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        rider_rated_at TIMESTAMPTZ,
        driver_rated_at TIMESTAMPTZ,
        
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("✅ Created rides table.");

    // RIDE RATINGS
    await sql`
      CREATE TABLE ride_ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
        rater_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rated_driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
        rated_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        driver_rating INTEGER CHECK (driver_rating BETWEEN 1 AND 5),
        rider_rating INTEGER CHECK (rider_rating BETWEEN 1 AND 5),
        driver_review TEXT,
        rider_review TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("✅ Created ride_ratings table.");

    // STUDENT OFFERS
    await sql`
      CREATE TABLE student_offers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      );
    `;
    console.log("✅ Created student_offers table.");

    // STUDENT SAVED OFFERS
    await sql`
      CREATE TABLE student_saved_offers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        offer_id UUID REFERENCES student_offers(id) ON DELETE CASCADE,
        saved_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("✅ Created student_saved_offers table.");

    // MESSAGES
    await sql`
      CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("✅ Created messages table.");

    // NOTIFICATIONS
    await sql`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        data JSONB,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("✅ Created notifications table.");

    // 3. ROW LEVEL SECURITY (RLS)
    console.log("🔐 Configuring RLS Policies...");
    const tables = [
      "users",
      "drivers",
      "rides",
      "ride_ratings",
      "student_offers",
      "student_saved_offers",
      "messages",
      "notifications",
    ];

    // Enable RLS but allow everything for authenticated clients (the Supabase anon key + Clerk token setup)
    for (const table of tables) {
      await sql.unsafe(
        `ALTER TABLE IF EXISTS "${table}" ENABLE ROW LEVEL SECURITY;`,
      );
      await sql.unsafe(
        `CREATE POLICY "Allow All" ON "${table}" FOR ALL USING (true) WITH CHECK (true);`,
      );
    }
    console.log("✅ RLS Configured (Allow All bypass).");

    console.log("🚀 Database Wipe & Rebuild Complete!");
  } catch (error) {
    console.error("❌ Error during wipe and rebuild:", error);
  } finally {
    await sql.end();
  }
}

wipeAndRebuild();
