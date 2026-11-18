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
