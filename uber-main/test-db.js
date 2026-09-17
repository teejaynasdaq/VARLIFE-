const postgres = require("postgres");
const sql = postgres(
  "postgresql://postgres.crsqiclxyeyzgdhfjxwl:V%40rsityLife190@aws-1-eu-west-1.pooler.supabase.com:5432/postgres",
);

async function runMigrations() {
  try {
    console.log("Running migrations...");

    // 1. Add user_id to drivers table (to link supabase auth user to driver record)
    await sql`
      ALTER TABLE drivers 
      ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE
    `;
    console.log("✅ Added user_id column to drivers");

    // 2. Add profile_image to users if not exists
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_image_url TEXT
    `;
    console.log("✅ Added profile_image_url to users");

    // 3. Add card payment option support - rides table already has payment_method as text, just need to ensure 'card' is supported
    // No changes needed for rides - payment_method is text, can store any value

    // 4. Add driver_id link to deliveries
    await sql`
      ALTER TABLE deliveries 
      ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id)
    `;
    console.log("✅ Added driver_id to deliveries");

    // 5. Add completed_at and updated_at to deliveries
    await sql`
      ALTER TABLE deliveries
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
      ADD COLUMN IF NOT EXISTS driver_notes TEXT
    `;
    console.log("✅ Added timestamp fields to deliveries");

    // 6. Add read status to messages
    await sql`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false
    `;
    console.log("✅ Added is_read to messages");

    // 7. Add tip field to rides (for cash tips)
    await sql`
      ALTER TABLE rides
      ADD COLUMN IF NOT EXISTS tip_amount NUMERIC DEFAULT 0
    `;
    console.log("✅ Added tip_amount to rides");

    // 8. Add stripe_payment_method_id and card payment to rides
    await sql`
      ALTER TABLE rides
      ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT
    `;
    console.log("✅ Added stripe_payment_intent_id to rides");

    // 9. Add index on rides.status for faster driver queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status)
    `;
    console.log("✅ Created index on rides.status");

    // 10. Add index on rides.driver_id
    await sql`
      CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id)
    `;
    console.log("✅ Created index on rides.driver_id");

    // 11. Add index on drivers.is_online
    await sql`
      CREATE INDEX IF NOT EXISTS idx_drivers_is_online ON drivers(is_online)
    `;
    console.log("✅ Created index on drivers.is_online");

    // 12. Ensure ride_negotiations table has status field
    await sql`
      ALTER TABLE ride_negotiations
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
    `;
    console.log("✅ Added status to ride_negotiations");

    console.log("\n✅ All migrations completed successfully!");
  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    process.exit();
  }
}

runMigrations();
