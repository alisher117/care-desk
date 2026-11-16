export type TicketStatus = "open" | "pending" | "resolved" | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type ActorType = "requester" | "operator" | "system";

export type OperatorStatus = "online" | "offline";

export type NoteKind = "internal" | "client";

export interface Ticket {
  id: string;
  number: number;
  requesterId: string;
  requesterName: string;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  requesterProfile?: Record<string, unknown> | null;
  subject: string;
  description: string;
  priority: TicketPriority;
  category?: string | null;
  status: TicketStatus
  assignedOperatorId?: string | null;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  firstActionAt?: Date | null;
  resolvedAt?: Date | null;
  closedAt?: Date | null;
}

export interface TicketNote {
  id: string;
  ticketId: string;
  operatorId: string;
  body: string;
  kind: NoteKind;
  createdAt: Date;
}

export interface Operator {
  id: string;
  hostUserId: string;
  displayName?: string | null;
  status: OperatorStatus;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  requesterVisible: boolean;
  sortOrder: number;
  archivedAt?: Date | null;
  createdAt: Date;
}
