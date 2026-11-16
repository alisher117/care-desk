export interface Requester {
  id: string;
  displayName: string;
  email?: string;
  profile?: Record<string, unknown>;
}

export interface OperatorIdentity {
  id: string;
  displayName: string;
  email?: string;
  moderator?: boolean;
}

export interface IdentityAdapter {
  resolveRequester(ctx: unknown): Promise<Requester | null>
  resolveOperator(ctx: unknown): Promise<OperatorIdentity | null>;
}
