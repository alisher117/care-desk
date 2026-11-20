import "server-only";
import { getPool } from "../core";

export type UserRole = "operator" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export async function hasUsers(): Promise<boolean> {
  const { rows } = await getPool().query("Select 1 from users limit 1");
  return rows.length > 0;
}

export async function createFirstAccount(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<User | null> {
  const { rows } = await getPool().query(
    `insert into users (name, email, password_hash, role)
     select $1, $2, $3, 'admin'
     where not exists (select 1 from users)
     returning id, name, email, role`,
    [input.name, input.email, input.passwordHash],
  );
  return rows[0] ?? null;
}

export async function findUserForLogin(
  email: string,
): Promise<(User & { passwordHash: string }) | null> {
  const { rows } = await getPool().query<User & { password_hash: string }>(
    `select id, name, email, role, password_hash from users where lower(email) = lower($1)`,
    [email],
  );
  const row = rows[0];
  if (!row) return null;
  const { password_hash, ...user } = row;
  return { ...user, passwordHash: password_hash };
}

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await getPool().query<User>(
    `select id, name, email, role from users where id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function listUsers(): Promise<User[]> {
  const { rows } = await getPool().query<User>(
    `select id, name, email, role from users order by name`,
  );
  return rows;
}
