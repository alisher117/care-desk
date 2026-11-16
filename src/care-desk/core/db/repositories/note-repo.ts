import { getPool } from "../pool";
import type { NoteKind, TicketNote } from "../../domain/types";

interface NoteRow {
  id: string;
  ticket_id: string;
  operator_id: string;
  body: string;
  kind: string;
  created_at: Date;
}

function toNote(row: NoteRow): TicketNote {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    operatorId: row.operator_id,
    body: row.body,
    kind: row.kind as NoteKind,
    createdAt: row.created_at,
  };
}

export const noteRepo = {
  async create(
    ticketId: string,
    operatorId: string,
    body: string,
    kind: NoteKind = "internal",
  ): Promise<TicketNote> {
    const { rows } = await getPool().query<NoteRow>(
      `insert into care_ticket_notes (ticket_id, operator_id, body, kind)
       values ($1, $2, $3, $4)
       returning *`,
      [ticketId, operatorId, body, kind],
    );
    const row = rows[0];
    if (!row) throw new Error("Care Desk: insert into care_ticket_notes returned no row");
    return toNote(row);
  },

  async listByTicket(ticketId: string): Promise<TicketNote[]> {
    const { rows } = await getPool().query<NoteRow>(
      `select * from care_ticket_notes where ticket_id = $1 order by created_at asc`,
      [ticketId],
    );
    return rows.map(toNote);
  },
};
