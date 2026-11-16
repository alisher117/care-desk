import type { Operator, OperatorIdentity, Requester } from "../core";
import { operatorService } from "../core";
import { identityAdapter } from "./identity-adapter";

export async function requireRequester(req: Request): Promise<Requester | null> {
  return identityAdapter.resolveRequester(req);
}

export interface OperatorContext {
  identity: OperatorIdentity;
  operator: Operator;
}

export async function requireOperator(req: Request): Promise<OperatorContext | null> {
  const identity = await identityAdapter.resolveOperator(req);
  if (!identity) return null;
  const operator = await operatorService.ensureOperator(identity);
  return { identity, operator };
}

/**
 * Response for a request `requireOperator` turned away. With real auth,
 * answer 401 `{ error: "unauthorized", reason }` for a missing or ended
 * session (the dashboard redirects on reason `session_idle` / `session_ended`
 * once `LOGIN_PATH` is set in web/routes.ts) and keep 403 for a signed-in
 * user who is not an operator.
 */
export async function operatorDenied(): Promise<Response> {
  return Response.json({ error: "forbidden" }, { status: 403 });
}
