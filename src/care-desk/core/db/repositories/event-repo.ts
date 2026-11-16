import { getPool } from "../pool";
import type { DomainEvent, DomainEventType, NewDomainEvent } from "../../domain/events";
import type { ActorType } from "../../domain/types";

interface EventRow {
  id: string;
  ticket_id: string;
  type: string;
  actor_type: string;
  actor_id: string | null;
  data: Record<string, unknown>;
  created_at: Date;
}

function toEvent(row: EventRow): DomainEvent {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    type: row.type as DomainEventType,
    actorType: row.actor_type as ActorType,
    actorId: row.actor_id,
    data: row.data,
    createdAt: row.created_at,
  };
}

export const eventRepo = {
  async record(event: NewDomainEvent): Promise<DomainEvent> {
    const { rows } = await getPool().query<EventRow>(
      `insert into care_events (ticket_id, type, actor_type, actor_id, data)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [
        event.ticketId,
        event.type,
        event.actorType,
        event.actorId ?? null,
        JSON.stringify(event.data ?? {}),
      ],
    );
    const row = rows[0];
    if (!row) throw new Error("Care Desk: insert into care_events returned no row");
    return toEvent(row);
  },

  async listByTicket(ticketId: string): Promise<DomainEvent[]> {
    const { rows } = await getPool().query<EventRow>(
      `select * from care_events where ticket_id = $1 order by created_at asc`,
      [ticketId],
    );
    return rows.map(toEvent);
  },
};
