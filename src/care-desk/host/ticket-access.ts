import type { Ticket } from "../core";
import type { OperatorContext } from "./route-guards";

export function canEditTicket(op: OperatorContext, ticket: Ticket): boolean {
  if (op.identity.moderator) return true;
  return ticket.assignedOperatorId === op.operator.id;
}
