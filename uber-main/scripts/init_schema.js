import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set in .env");
  process.exit(1);
}

const sql = postgres(connectionString);

async function initDB() {
  try {
    console.log("Initializing database schema...");

    // Add unique constraint to clerk_id on users table if not exists
    try {
      await sql`ALTER TABLE users ADD CONSTRAINT users_clerk_id_key UNIQUE (clerk_id);`;
      console.log("Added UNIQUE constraint to users.clerk_id");
    } catch (e) {
      if (e.code === "42P04") {
        // Constraint already exists
      } else {
        console.log(
          "Constraint on clerk_id already exists or error:",
          e.message,
        );
      }
    }

    // Role column if missing
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'rider';`;
    } catch (e) {
      console.log("Error adding role:", e.message);
    }

    await sql`
      CREATE TABLE IF NOT EXISTS driver_profiles (
        clerk_id TEXT PRIMARY KEY REFERENCES users(clerk_id) ON DELETE CASCADE,
        dob DATE,
        licence_number TEXT UNIQUE,
        id_number TEXT UNIQUE,
        vehicle_registration TEXT,
        vehicle_model TEXT,
        licence_doc_url TEXT,
        id_doc_url TEXT,
        vehicle_reg_doc_url TEXT,
        vehicle_photo_url TEXT,
        selfie_url TEXT,
        is_approved BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("driver_profiles table created/verified.");

    await sql`
      CREATE TABLE IF NOT EXISTS rides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rider_id TEXT REFERENCES users(clerk_id),
        driver_id TEXT REFERENCES users(clerk_id),
        pickup_lat DECIMAL,
        pickup_lng DECIMAL,
        pickup_address TEXT,
        dropoff_lat DECIMAL,
        dropoff_lng DECIMAL,
        dropoff_address TEXT,
        status TEXT DEFAULT 'requested',
        fare DECIMAL,
        distance DECIMAL,
        duration INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("rides table created/verified.");

    await sql`
      CREATE TABLE IF NOT EXISTS ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
        rater_id TEXT REFERENCES users(clerk_id),
        ratee_id TEXT REFERENCES users(clerk_id),
        rating INT CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("ratings table created/verified.");

    await sql`
      CREATE TABLE IF NOT EXISTS student_deals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        discount_percentage INT,
        category TEXT,
        expiry_date TIMESTAMP WITH TIME ZONE,
        partner_name TEXT,
        partner_logo_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("student_deals table created/verified.");

    console.log("Database initialization complete!");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    await sql.end();
  }
}

initDB();
