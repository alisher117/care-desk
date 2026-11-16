import { getPool } from "../pool";
import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "../../domain/types";

interface TicketRow {
  id: string;
  number: string; // bigint comes back as string
  requester_id: string;
  requester_name: string;
  requester_email: string | null;
  requester_phone: string | null;
  requester_profile: Record<string, unknown> | null;
  subject: string;
  description: string;
  priority: string;
  care_category: string | null;
  status: string;
  assigned_operator_id: string | null;
  due_date: Date | null;
  created_at: Date;
  updated_at: Date;
  first_action_at: Date | null;
  resolved_at: Date | null;
  closed_at: Date | null;
}

function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    number: Number(row.number),
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    requesterPhone: row.requester_phone,
    requesterProfile: row.requester_profile,
    subject: row.subject,
    description: row.description,
    priority: row.priority as TicketPriority,
    category: row.care_category,
    status: row.status as TicketStatus,
    assignedOperatorId: row.assigned_operator_id,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    firstActionAt: row.first_action_at,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
  };
}

export interface CreateTicketInput {
  requesterId: string;
  requesterName: string;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  requesterProfile?: Record<string, unknown> | null;
  subject: string;
  description: string;
  category?: string | null;
}

export interface TicketFilter {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignedOperatorId?: string | null;
  createdFrom?: Date;
  createdTo?: Date;
  search?: string;
}

export interface TicketPatch {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string | null;
  assignedOperatorId?: string | null;
  dueDate?: Date | null;
  firstActionAt?: Date | null;
  resolvedAt?: Date | null;
  closedAt?: Date | null;
}

export const ticketRepo = {
  async create(input: CreateTicketInput): Promise<Ticket> {
    const { rows } = await getPool().query<TicketRow>(
      `insert into care_tickets
         (requester_id, requester_name, requester_email, requester_phone,
          requester_profile, subject, description, care_category)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [
        input.requesterId,
        input.requesterName,
        input.requesterEmail ?? null,
        input.requesterPhone ?? null,
        input.requesterProfile ? JSON.stringify(input.requesterProfile) : null,
        input.subject,
        input.description,
        input.category ?? null,
      ],
    );
    const row = rows[0];
    if (!row) throw new Error("Care Desk: insert into care_tickets returned no row");
    return toTicket(row);
  },

  async findById(id: string): Promise<Ticket | null> {
    const { rows } = await getPool().query<TicketRow>(
      `select * from care_tickets where id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? toTicket(row) : null;
  },

  async list(filter: TicketFilter = {}): Promise<Ticket[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    const add = (clause: (i: number) => string, value: unknown) => {
      params.push(value);
      where.push(clause(params.length));
    };

    if (filter.status !== undefined) add((i) => `status = $${i}`, filter.status);
    if (filter.priority !== undefined) add((i) => `priority = $${i}`, filter.priority);
    if (filter.category !== undefined) add((i) => `care_category = $${i}`, filter.category);
    if (filter.assignedOperatorId === null) where.push("assigned_operator_id is null");
    else if (filter.assignedOperatorId !== undefined)
      add((i) => `assigned_operator_id = $${i}`, filter.assignedOperatorId);
    if (filter.createdFrom !== undefined) add((i) => `created_at >= $${i}`, filter.createdFrom);
    if (filter.createdTo !== undefined) add((i) => `created_at < $${i}`, filter.createdTo);
    if (filter.search !== undefined && filter.search.trim() !== "") {
      params.push(`%${filter.search.trim()}%`);
      const i = params.length;
      where.push(`(subject ilike $${i} or requester_name ilike $${i})`);
    }

    const whereSql = where.length ? `where ${where.join(" and ")}` : "";
    const { rows } = await getPool().query<TicketRow>(
      `select * from care_tickets ${whereSql} order by updated_at desc`,
      params,
    );
    return rows.map(toTicket);
  },

  async update(id: string, patch: TicketPatch): Promise<Ticket | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    const set = (col: string, value: unknown) => {
      params.push(value);
      sets.push(`${col} = $${params.length}`);
    };

    if (patch.status !== undefined) set("status", patch.status);
    if (patch.priority !== undefined) set("priority", patch.priority);
    if (patch.category !== undefined) set("care_category", patch.category);
    if (patch.assignedOperatorId !== undefined)
      set("assigned_operator_id", patch.assignedOperatorId);
    if (patch.dueDate !== undefined) set("due_date", patch.dueDate);
    if (patch.firstActionAt !== undefined) set("first_action_at", patch.firstActionAt);
    if (patch.resolvedAt !== undefined) set("resolved_at", patch.resolvedAt);
    if (patch.closedAt !== undefined) set("closed_at", patch.closedAt);

    if (sets.length === 0) return this.findById(id);

    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await getPool().query<TicketRow>(
      `update care_tickets set ${sets.join(", ")} where id = $${params.length} returning *`,
      params,
    );
    const row = rows[0];
    return row ? toTicket(row) : null;
  },
};
