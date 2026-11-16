import type { IdentityAdapter, OperatorIdentity, Requester } from "../core/contracts";

/**
 * NO AUTHENTICATION.
 *
 * Every visitor is treated as the same requester, and everyone who opens the
 * dashboard is the same operator with admin rights. This file is the only
 * place that decides who a request belongs to: swap `identityAdapter` for one
 * that reads a real session (Auth.js, a JWT, SSO headers) and neither `core/`
 * nor `web/` has to change.
 *
 * Until then, do not expose this app outside a trusted network.
 */

export const DEV_REQUESTER_ID = "dev-requester";
export const DEV_OPERATOR_ID = "dev-operator";

const env = (key: string): string | undefined => process.env[key]?.trim() || undefined;

export function devRequester(): Requester {
  return {
    id: DEV_REQUESTER_ID,
    displayName: env("CARE_DESK_DEV_REQUESTER_NAME") ?? "Demo Requester",
    email: env("CARE_DESK_DEV_REQUESTER_EMAIL"),
    // Anything put here is snapshotted onto the ticket and shown to operators.
    // `phone` is also copied to the ticket's contact column.
    profile: {},
  };
}

export function devOperator(): OperatorIdentity {
  return {
    id: DEV_OPERATOR_ID,
    displayName: env("CARE_DESK_DEV_OPERATOR_NAME") ?? "Demo Operator",
    email: env("CARE_DESK_DEV_OPERATOR_EMAIL"),
    moderator: true,
  };
}

export const openIdentityAdapter: IdentityAdapter = {
  async resolveRequester(): Promise<Requester | null> {
    return devRequester();
  },

  async resolveOperator(): Promise<OperatorIdentity | null> {
    return devOperator();
  },
};

export const identityAdapter: IdentityAdapter = openIdentityAdapter;
