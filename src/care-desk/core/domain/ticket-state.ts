import type { TicketStatus } from "./types";

const TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  open: ['pending', 'resolved', 'closed'],
  pending: ['open', 'resolved', 'closed'],
  resolved: ['open', 'closed'],
  closed: ['open'],
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: TicketStatus,
    public readonly to: TicketStatus,
  ) {
    super(`Care Desk: cannot change status from "${from}" to "${to}"`);
    this.name = 'InvalidTransitionError';
  }
}

export function assertTransition(from: TicketStatus, to: TicketStatus): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}
