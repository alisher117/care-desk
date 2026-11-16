import type { Operator } from "../core";
import { operatorService } from "../core";
import { DEV_OPERATOR_ID, devOperator } from "./identity-adapter";

export interface OperatorWithAccess extends Operator {
  /** False once the person behind the operator row has lost access in the host. */
  active: boolean;
}

export interface OperatorContact {
  email: string | null;
  name: string | null;
  locale: string | null;
}

/**
 * Operators the dashboard can assign tickets to. Without authentication every
 * known operator row counts as active; with real users, cross-check each
 * `hostUserId` against your user store here.
 */
export async function listOperatorsWithAccess(): Promise<OperatorWithAccess[]> {
  const operators = await operatorService.listOperators();
  return operators
    .map((o) => ({ ...o, active: true }))
    .sort((a, b) => (a.displayName ?? "").localeCompare(b.displayName ?? ""));
}

/**
 * Where to reach an operator (assignment emails). Care Desk stores only the
 * host user id, so the host looks the contact up in its own user store.
 */
export async function getOperatorContact(hostUserId: string): Promise<OperatorContact | null> {
  if (hostUserId !== DEV_OPERATOR_ID) return null;
  const operator = devOperator();
  return { email: operator.email ?? null, name: operator.displayName, locale: null };
}
