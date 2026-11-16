import type { OperatorContext } from "@/care-desk/host/route-guards";

export const TEST_OPERATOR_ID = "op-1";

export function operatorContext(moderator: boolean): OperatorContext {
  return {
    identity: { id: "host-1", displayName: "Op", moderator },
    operator: {
      id: TEST_OPERATOR_ID,
      hostUserId: "host-1",
      displayName: "Op",
      status: "offline",
      createdAt: new Date(0),
    },
  };
}
