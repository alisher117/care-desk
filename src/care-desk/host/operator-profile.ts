import type { OperatorContext } from "./route-guards";

export interface OperatorProfile {
  operatorId: string;
  hostUserId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  department: string | null;
  position: string | null;
  lastLoginAt: string | null;
}

/**
 * What the dashboard's Account page shows. Only the identity is known here;
 * fill phone, department, position and last sign-in from your user store once
 * the project has one.
 */
export async function getOperatorProfile(op: OperatorContext): Promise<OperatorProfile> {
  return {
    operatorId: op.operator.id,
    hostUserId: op.operator.hostUserId,
    displayName: op.identity.displayName,
    email: op.identity.email ?? null,
    phone: null,
    role: op.identity.moderator ? "admin" : "operator",
    department: null,
    position: null,
    lastLoginAt: null,
  };
}
