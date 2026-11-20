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

export async function operatorDenied(): Promise<Response> {
  return Response.json({ error: "unauthorized", reason: "session_ended" }, { status: 401 });
}
