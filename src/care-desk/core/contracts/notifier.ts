import type { Operator, Ticket, TicketStatus } from "../domain/types";

export interface StatusChangeNotification {
  ticket: Ticket;
  from: TicketStatus;
  to: TicketStatus;
  comment?: string;
}

export interface AssignmentNotification {
  ticket: Ticket;
  operator: Operator;
}

export interface TicketCreatedNotification {
  ticket: Ticket;
}

export interface Notifier {
  notifyCreated(input: TicketCreatedNotification): Promise<void>;
  notifyStatusChange(input: StatusChangeNotification): Promise<void>;
  notifyAssigned(input: AssignmentNotification): Promise<void>;
}
