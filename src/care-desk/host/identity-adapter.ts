import type { IdentityAdapter, OperatorIdentity, Requester } from "../core/contracts";
import { getCurrentUser } from "@/app/actions/auth";

export const identityAdapter: IdentityAdapter = {
  async resolveRequester(): Promise<Requester | null> {
    const user = await getCurrentUser();
    if (!user) return null;
    return { id: user.id, displayName: user.name, email: user.email, profile: {} };
  },
  async resolveOperator(): Promise<OperatorIdentity | null> {
    const user = await getCurrentUser();
    if (!user) return null;
    return {
      id: user.id,
      displayName: user.name,
      email: user.email,
      moderator: user.role === 'admin',
    };
  },
};