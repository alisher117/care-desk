import { eventRepo } from "../db/repositories/event-repo";
import { noteRepo } from "../db/repositories/note-repo";
import { ticketRepo } from "../db/repositories/ticket-repo";
import type { NoteKind, TicketNote } from "../domain/types";

export const noteService = {
  async add(
    ticketId: string,
    operatorId: string,
    body: string,
    kind: NoteKind = "internal",
  ): Promise<TicketNote> {
    const ticket = await ticketRepo.findById(ticketId);
    if (!ticket) throw new Error(`Care Desk: ticket ${ticketId} not found`);

    const note = await noteRepo.create(ticketId, operatorId, body, kind);

    if (!ticket.firstActionAt) {
      await ticketRepo.update(ticketId, { firstActionAt: new Date() });
    }

    await eventRepo.record({
      ticketId,
      type: "note.added",
      actorType: "operator",
      actorId: operatorId,
      data: { noteId: note.id, kind },
    });

    return note;
  },

  async list(ticketId: string): Promise<TicketNote[]> {
    return noteRepo.listByTicket(ticketId);
  },
};
