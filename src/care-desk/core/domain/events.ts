import { ActorType } from "./types";

export type DomainEventType =
  | "ticket.created"
  | "ticket.status_changed"
  | "ticket.assigned"
  | "ticket.priority_changed"
  | "ticket.category_changed"
  | "ticket.due_changed"
  | "note.added";

export interface DomainEvent {
  id: string;
  ticketId: string;
  type: DomainEventType;
  actorType: ActorType;
  actorId?: string | null;
  data: Record<string, unknown>;
  createdAt: Date;
}

export interface NewDomainEvent {
  ticketId: string;
  type: DomainEventType;
  actorType: ActorType;
  actorId?: string | null;
  data?: Record<string, unknown>;
}
