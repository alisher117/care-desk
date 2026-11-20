import type { Operator } from "../core";
import { operatorService } from "../core";
import { listUsers } from "./users";

export interface OperatorWithAccess extends Operator {
  active: boolean;
}

export interface OperatorContact {
  email: string | null;
  name: string | null;
  locale: string | null;
}

export async function listOperatorsWithAccess(): Promise<OperatorWithAccess[]> {
  const [operators, users] = await Promise.all([
    operatorService.listOperators(),
    listUsers(),
  ]);
  const userIds = new Set(users.map((u) => u.id));
  return operators
    .map((o) => ({ ...o, active: userIds.has(o.hostUserId) }))
    .sort((a, b) => (a.displayName ?? "").localeCompare(b.displayName ?? ""));
}

export async function getOperatorContact(
  hostUserId: string,
): Promise<OperatorContact | null> {
  const user = (await listUsers()).find((u) => u.id === hostUserId);
  return user ? { email: user.email, name: user.name, locale: null } : null;
}
