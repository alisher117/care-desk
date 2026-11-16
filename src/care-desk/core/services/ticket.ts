import { eventRepo } from "../db/repositories/event-repo";
import { noteRepo } from "../db/repositories/note-repo";
import { operatorRepo } from "../db/repositories/operator-repo";
import {
  ticketRepo,
  type CreateTicketInput,
  type TicketFilter,
  type TicketPatch,
} from "../db/repositories/ticket-repo";
import { assertTransition } from "../domain/ticket-state";
import type {
  ActorType,
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../domain/types";
import { getNotifier } from "../notifier";


export interface Actor {
  type: ActorType;
  id?: string | null;
}

export type { TicketFilter };

export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string | null;
  assignedOperatorId?: string | null;
  dueDate?: Date | null;
  comment?: string;
}

export const ticketService = {
  async create(input: CreateTicketInput): Promise<Ticket> {
    const ticket = await ticketRepo.create(input);
    await eventRepo.record({
      ticketId: ticket.id,
      type: "ticket.created",
      actorType: "requester",
      actorId: input.requesterId,
      data: { subject: ticket.subject, number: ticket.number },
    });

    const notifier = getNotifier();
    if (notifier) {
      void notifier.notifyCreated({ ticket }).catch((err) => {
        console.error("[care-desk] new ticket notification failed", err);
      });
    }

    return ticket;
  },

  async get(id: string): Promise<Ticket | null> {
    return ticketRepo.findById(id)
  },

  async list(filter: TicketFilter = {}): Promise<Ticket[]> {
    return ticketRepo.list(filter);
  },

  async update(id: string, changes: UpdateTicketInput, actor: Actor): Promise<Ticket> {
    const current = await ticketRepo.findById(id);
    if (!current) throw new Error(`Care Desk: ticket ${id} not found`);
    const patch: TicketPatch = {};
    const now = new Date();

    if (actor.type === "operator" && !current.firstActionAt) {
      patch.firstActionAt = now;
    }

    if (changes.status !== undefined && changes.status !== current.status) {
      assertTransition(current.status, changes.status);
      patch.status = changes.status;
      if (changes.status === "resolved") {
        patch.resolvedAt = now;
      } else if (changes.status === "closed") {
        patch.closedAt = now;
      } else if (changes.status === "open") {
        patch.resolvedAt = null;
        patch.closedAt = null;
      }
    }

    if (changes.priority !== undefined && changes.priority !== current.priority) {
      patch.priority = changes.priority
    }
    if (changes.category !== undefined && changes.category !== current.category) {
      patch.category = changes.category
    }
    if (changes.assignedOperatorId !== undefined && changes.assignedOperatorId !== current.assignedOperatorId) {
      patch.assignedOperatorId = changes.assignedOperatorId
    }
    if (changes.dueDate !== undefined && changes.dueDate?.getTime() !== current.dueDate?.getTime()) {
      patch.dueDate = changes.dueDate
    }
    const updated = await ticketRepo.update(id, patch);
    if (!updated) throw new Error(`Care Desk: ticket ${id} vanished mid-update`);

    if (patch.status !== undefined) {
      await eventRepo.record({
        ticketId: id, type: "ticket.status_changed", actorType: actor.type, actorId: actor.id ?? null, data: { from: current.status ?? null, to: patch.status }
      });

      const comment = changes.comment?.trim() || undefined;
      if (comment && actor.type === "operator" && actor.id) {
        const note = await noteRepo.create(id, actor.id, comment, "client");
        await eventRepo.record({
          ticketId: id, type: "note.added", actorType: "operator", actorId: actor.id, data: { noteId: note.id, kind: "client" },
        });
      }

      const notifier = getNotifier();
      if (notifier && updated.requesterEmail) {
        void notifier
          .notifyStatusChange({ ticket: updated, from: current.status, to: patch.status, comment })
          .catch((err) => {
            console.error("[care-desk] status notification failed", err);
          });
      }
    }

    if (patch.priority !== undefined) {
      await eventRepo.record({
        ticketId: id, type: "ticket.priority_changed", actorType: actor.type, actorId: actor.id ?? null, data: { from: current.priority, to: patch.priority },
      });
    }

    if (patch.category !== undefined) {
      await eventRepo.record({
        ticketId: id, type: "ticket.category_changed", actorType: actor.type, actorId: actor.id ?? null, data: { from: current.category ?? null, to: patch.category },
      });
    }

    if (patch.assignedOperatorId !== undefined) {
      await eventRepo.record({
        ticketId: id, type: "ticket.assigned", actorType: actor.type, actorId: actor.id ?? null, data: { from: current.assignedOperatorId ?? null, to: patch.assignedOperatorId },
      });

      const assigneeId = patch.assignedOperatorId;
      const notifier = getNotifier();
      if (notifier && assigneeId && assigneeId !== actor.id) {
        const operator = await operatorRepo.findById(assigneeId);
        if (operator) {
          void notifier
            .notifyAssigned({ ticket: updated, operator })
            .catch((err) => {
              console.error("[care-desk] assignment notification failed", err);
            });
        }
      }
    }

    if (patch.dueDate !== undefined) {
      await eventRepo.record({
        ticketId: id, type: "ticket.due_changed", actorType: actor.type, actorId: actor.id ?? null, data: { to: patch.dueDate ? patch.dueDate.toISOString() : null },
      });
    }

    return updated;
  }
}
