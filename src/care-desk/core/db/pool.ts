import { Pool } from "pg";

let pool: Pool | null = null;

export function initPool(connectionString?: string): Pool {
  if (pool) return pool;
  const url = connectionString ?? process.env.CARE_DESK_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error(`We couldn't set the database URL or the care desk database URL`);
  pool = new Pool({ connectionString: url })
  return pool;
}

export function getPool(): Pool {
  return pool ?? initPool();
};

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
