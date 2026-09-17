require("dotenv").config();
const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL);

async function verify() {
  try {
    const tables =
      await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log(
      "TABLES IN PUBLIC SCHEMA:",
      tables.map((t) => t.table_name),
    );

    const users = await sql`SELECT * FROM users`;
    console.log(
      "USERS IN DB:",
      users.length > 0 ? users : "No users registered yet.",
    );
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
verify();
