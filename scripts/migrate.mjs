// Applies src/care-desk/core/db/migrations/*.sql in file-name order, once each.
//   npm run migrate            apply what is pending
//   npm run migrate -- status  list applied / pending, change nothing
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "src", "care-desk", "core", "db", "migrations");

// Next.js loads .env files for the app; this script runs on its own.
for (const name of [".env.local", ".env"]) {
  const file = path.join(root, name);
  if (fs.existsSync(file)) process.loadEnvFile(file);
}

const url = process.env.CARE_DESK_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Set CARE_DESK_DATABASE_URL (or DATABASE_URL), e.g. in .env.local");
  process.exit(1);
}

const statusOnly = process.argv[2] === "status";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const client = new pg.Client({ connectionString: url });

try {
  await client.connect();
  await client.query(`
    create table if not exists care_schema_migrations (
      name        text primary key,
      applied_at  timestamptz not null default now()
    )`);
  const { rows } = await client.query("select name from care_schema_migrations");
  const applied = new Set(rows.map((r) => r.name));

  // A database that already has the tables but no bookkeeping (schema applied
  // by hand with psql) must not be re-run from 0001.
  if (applied.size === 0) {
    const { rows: existing } = await client.query("select to_regclass('care_tickets') as t");
    if (existing[0].t) {
      console.error(
        "care_tickets already exists but no migrations are recorded.\n" +
          "Insert the names of the files already applied into care_schema_migrations, then run again.",
      );
      process.exit(1);
    }
  }

  let pending = 0;
  for (const file of files) {
    if (applied.has(file)) {
      if (statusOnly) console.log(`applied  ${file}`);
      continue;
    }
    pending++;
    if (statusOnly) {
      console.log(`pending  ${file}`);
      continue;
    }
    // Each file carries its own begin/commit. A failure rolls that file back,
    // is not recorded, and stops the run.
    try {
      await client.query(fs.readFileSync(path.join(dir, file), "utf8"));
    } catch (err) {
      await client.query("rollback").catch(() => {});
      throw new Error(`${file} failed: ${err.message}`);
    }
    await client.query("insert into care_schema_migrations (name) values ($1)", [file]);
    console.log(`applied  ${file}`);
  }
  if (pending === 0) console.log("Nothing to apply, schema is up to date.");
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
