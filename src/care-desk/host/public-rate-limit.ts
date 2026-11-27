import "server-only";
import { createHmac } from "node:crypto";
import { getPool } from "../core";

const MAX_PER_IP = 10;
const IP_WINDOW_MINUTES = 10;
const MAX_PER_EMAIL = 5;
const EMAIL_WINDOW_MINUTES = 60;

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "unknown";
}


function hashIp(ip: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET ?? "care-desk").update(ip).digest("hex");
}


export async function allowPublicSubmission(ip: string, email: string): Promise<boolean> {
  const pool = getPool();
  const { rows } = await pool.query(
    `with recent as (
       select
         count(*) filter (
           where ip_hash = $1 and created_at > now() - make_interval(mins => $3::int)
         ) as by_ip,
         count(*) filter (
           where email = $2 and created_at > now() - make_interval(mins => $4::int)
         ) as by_email
       from public_submissions
     )
     insert into public_submissions (ip_hash, email)
     select $1, $2 from recent
     where by_ip < $5::int and by_email < $6::int
     returning id`,
    [hashIp(ip), email, IP_WINDOW_MINUTES, EMAIL_WINDOW_MINUTES, MAX_PER_IP, MAX_PER_EMAIL],
  );

  pool
    .query("delete from public_submissions where created_at < now() - interval '1 day'")
    .catch((err) => console.error("[care-desk] rate limit cleanup failed", err));

  return rows.length > 0;
}