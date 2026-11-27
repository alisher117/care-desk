import { createHash, randomBytes } from 'node:crypto'
import 'server-only'
import { getPool } from '../core'
import type { User, UserRole } from './users'


const INVITE_DAYS = 7

export interface Invite {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
}

interface InviteRow {
  id: string;
  email: string;
  role: UserRole;
  expires_at: Date;
}

const toInvite = (r: InviteRow): Invite => ({
  id: r.id,
  email: r.email,
  role: r.role,
  expiresAt: r.expires_at,
});

const hashToken = (token: string) => createHash("sha256").update(token).digest('hex');

export async function createInvite(input: {
  email: string;
  role: UserRole;
  invitedBy: string;
}): Promise<{ invite: Invite; token: string } | { error: 'user_exists' }> {
  const pool = getPool();
  const existing = await pool.query("delete from invites where lower(email) = lower($1) and used_at is null", [
    input.email,
  ]);
  const token = randomBytes(32).toString('base64url');
  const { rows } = await pool.query<InviteRow>(
    `insert into invites (email, role, token_hash, invited_by, expires_at)
     values ($1, $2, $3, $4, now() + make_interval(days => $5::int))
     returning id, email, role, expires_at`,
    [input.email, input.role, hashToken(token), input.invitedBy, INVITE_DAYS],
  );
  return { invite: toInvite(rows[0]), token };
}

export async function findValidInvite(token: string): Promise<Invite | null> {
  const { rows } = await getPool().query<InviteRow>(
    `select id, email, role, expires_at from invites
     where token_hash = $1 and used_at is null and expires_at > now()`,
    [hashToken(token)],
  );
  return rows[0] ? toInvite(rows[0]) : null;
}

export async function acceptInvite(
  token: string,
  input: { name: string; passwordHash: string },
): Promise<User | null> {
  try {
    const { rows } = await getPool().query<User>(
      `with inv as (
         update invites set used_at = now()
         where token_hash = $1 and used_at is null and expires_at > now()
         returning email, role
       )
       insert into users (name, email, password_hash, role)
       select $2, inv.email, $3, inv.role from inv
       returning id, name, email, role`,
      [hashToken(token), input.name, input.passwordHash],
    );
    return rows[0] ?? null;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") return null;
    throw err;
  }
}

export async function listPendingInvites(): Promise<Invite[]> {
  const { rows } = await getPool().query<InviteRow>(
    `select id, email, role, expires_at from invites
     where used_at is null and expires_at > now()
     order by created_at desc`,
  );
  return rows.map(toInvite);
}

export async function revokeInvite(id: string): Promise<void> {
  await getPool().query("delete from invites where id = $1 and used_at is null", [id]);
}
