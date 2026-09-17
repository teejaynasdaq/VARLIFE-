import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  console.log("RLS");
  console.log(
    await sql`
      select c.relname, c.relrowsecurity, c.relforcerowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname in ('users', 'drivers', 'rides')
      order by c.relname
    `,
  );

  console.log("POLICIES");
  console.log(
    await sql`
      select tablename, policyname, permissive, roles, cmd, qual, with_check
      from pg_policies
      where schemaname = 'public'
        and tablename in ('users', 'drivers', 'rides')
      order by tablename, policyname
    `,
  );

  console.log("USER CONSTRAINTS");
  console.log(
    await sql`
      select conname, contype, pg_get_constraintdef(oid) as def
      from pg_constraint
      where conrelid = 'public.users'::regclass
      order by conname
    `,
  );

  console.log("EMAIL TYPE");
  console.log(
    await sql`
      select t.typname, t.typtype, t.typcategory, e.enumlabel
      from pg_type t
      left join pg_enum e on e.enumtypid = t.oid
      where t.oid = (
        select atttypid
        from pg_attribute
        where attrelid = 'public.users'::regclass
          and attname = 'email'
      )
    `,
  );

  await sql.end();
}

main().catch(async (error) => {
  console.error(error);
  await sql.end();
  process.exit(1);
});
