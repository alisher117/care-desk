import ExcelJS from "exceljs";

import { getPool } from "../db/pool";
import { eventRepo } from "../db/repositories/event-repo";
import { noteRepo } from "../db/repositories/note-repo";
import { ticketRepo } from "../db/repositories/ticket-repo";
import { toCsv } from "../lib/csv";

export interface ExportPeriod {
  from: Date;
  to: Date;
}

interface ExportRow {
  number: string;
  subject: string;
  requester_name: string;
  requester_email: string | null;
  requester_phone: string | null;
  priority: string;
  care_category: string | null;
  status: string;
  operator_name: string | null;
  due_date: Date | null;
  created_at: Date;
  resolved_at: Date | null;
  closed_at: Date | null;
  first_action_sec: string | null;
  resolution_sec: string | null;
  note_count: string;
}

const iso = (d: Date | null): string => (d ? d.toISOString() : "");
const secs = (v: string | null): string => (v ? String(Math.round(Number(v))) : "");
const secNum = (v: string | null): number | null =>
  v === null ? null : Math.round(Number(v));

function durationHuman(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

const EXPORT_SQL = `select t.number, t.subject, t.requester_name, t.requester_email, t.requester_phone,
        t.priority, t.care_category, t.status, o.display_name as operator_name,
        t.due_date, t.created_at, t.resolved_at, t.closed_at,
        extract(epoch from (t.first_action_at - t.created_at)) as first_action_sec,
        extract(epoch from (t.resolved_at - t.created_at))     as resolution_sec,
        (select count(*) from care_ticket_notes n where n.ticket_id = t.id) as note_count
 from care_tickets t
 left join care_operators o on o.id = t.assigned_operator_id
 where t.created_at >= $1 and t.created_at < $2
 order by t.number`;

export const exportService = {
  async ticketsCsv(period: ExportPeriod): Promise<string> {
    const { rows } = await getPool().query<ExportRow>(EXPORT_SQL, [period.from, period.to]);

    return toCsv(
      ["number", "subject", "requester_name", "email", "phone", "priority", "category",
        "status", "operator", "due_date", "created_at", "resolved_at", "closed_at",
        "first_action_sec", "resolution_sec", "note_count"],
      rows.map((r) => [
        `#${String(r.number).padStart(3, "0")}`, r.subject, r.requester_name,
        r.requester_email, r.requester_phone, r.priority, r.care_category, r.status,
        r.operator_name, iso(r.due_date), iso(r.created_at), iso(r.resolved_at),
        iso(r.closed_at), secs(r.first_action_sec), secs(r.resolution_sec), r.note_count,
      ]),
    );
  },

  async ticketsXlsx(period: ExportPeriod): Promise<Buffer> {
    const { rows } = await getPool().query<ExportRow>(EXPORT_SQL, [period.from, period.to]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Tickets", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    const dateCol = { style: { numFmt: "dd.mm.yyyy hh:mm" }, width: 17 };
    sheet.columns = [
      { header: "Number", key: "number", width: 9 },
      { header: "Subject", key: "subject", width: 40 },
      { header: "Requester", key: "requester", width: 24 },
      { header: "Email", key: "email", width: 28 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Priority", key: "priority", width: 10 },
      { header: "Category", key: "category", width: 14 },
      { header: "Status", key: "status", width: 10 },
      { header: "Operator", key: "operator", width: 22 },
      { header: "Due date", key: "dueDate", ...dateCol },
      { header: "Created", key: "createdAt", ...dateCol },
      { header: "Resolved", key: "resolvedAt", ...dateCol },
      { header: "Closed", key: "closedAt", ...dateCol },
      { header: "First action", key: "firstAction", width: 12 },
      { header: "Resolution", key: "resolution", width: 12 },
      { header: "Notes", key: "notes", width: 8 },
    ];

    for (const r of rows) {
      sheet.addRow({
        number: `#${String(r.number).padStart(3, "0")}`,
        subject: r.subject,
        requester: r.requester_name,
        email: r.requester_email,
        phone: r.requester_phone,
        priority: r.priority,
        category: r.care_category,
        status: r.status,
        operator: r.operator_name,
        dueDate: r.due_date,
        createdAt: r.created_at,
        resolvedAt: r.resolved_at,
        closedAt: r.closed_at,
        firstAction: durationHuman(secNum(r.first_action_sec)),
        resolution: durationHuman(secNum(r.resolution_sec)),
        notes: Number(r.note_count),
      });
    }

    sheet.getRow(1).font = { bold: true };
    sheet.autoFilter = { from: "A1", to: "P1" };

    const out = await workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer);
  },

  async ticketRecord(ticketId: string): Promise<string> {
    const ticket = await ticketRepo.findById(ticketId);
    if (!ticket) throw new Error(`Care Desk: ticket ${ticketId} not found`);

    const notes = await noteRepo.listByTicket(ticketId);
    const events = await eventRepo.listByTicket(ticketId);

    type Line = { at: Date; text: string };
    const lines: Line[] = [];
    for (const n of notes) {
      lines.push({ at: n.createdAt, text: `Note [${n.kind}] by operator ${n.operatorId}: ${n.body}` });
    }
    for (const e of events) {
      lines.push({
        at: e.createdAt,
        text: `-- ${e.type} by ${e.actorType}${e.actorId ? ` (${e.actorId})` : ""} ${JSON.stringify(e.data)}`,
      });
    }
    lines.sort((a, b) => a.at.getTime() - b.at.getTime());

    const header = [
      `Care Desk ticket #${String(ticket.number).padStart(3, "0")} — ${ticket.subject}`,
      `Requester: ${ticket.requesterName}` +
      (ticket.requesterEmail ? ` · ${ticket.requesterEmail}` : "") +
      (ticket.requesterPhone ? ` · ${ticket.requesterPhone}` : ""),
      `Priority: ${ticket.priority} · Category: ${ticket.category ?? "—"} · Status: ${ticket.status}`,
      `Opened: ${ticket.createdAt.toISOString()}`,
      "",
      "PROBLEM:",
      ticket.description,
      "".padEnd(60, "="),
    ];
    return [...header, ...lines.map((l) => `[${l.at.toISOString()}] ${l.text}`)].join("\n");
  },
};
