import type { TicketPriority, TicketStatus } from "@/care-desk/core";
import { ticketService, type TicketFilter } from "@/care-desk/core";
import "@/care-desk/host/init";
import { operatorDenied, requireOperator } from "@/care-desk/host/route-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["open", "pending", "resolved", "closed"]);
const PRIORITIES = new Set(["low", "medium", "high", "urgent"]);

export async function GET(req: Request) {
  const op = await requireOperator(req);
  if (!op) return operatorDenied();

  const p = new URL(req.url).searchParams;
  const filter: TicketFilter = {};

  const status = p.get("status");
  if (status) {
    if (!STATUSES.has(status)) return Response.json({ error: "bad status" }, { status: 400 });
    filter.status = status as TicketStatus;
  }
  const priority = p.get("priority");
  if (priority) {
    if (!PRIORITIES.has(priority)) return Response.json({ error: "bad priority" }, { status: 400 });
    filter.priority = priority as TicketPriority;
  }
  const category = p.get("category");
  if (category) filter.category = category;
  const assignee = p.get("assignedOperatorId");
  if (assignee) filter.assignedOperatorId = assignee === "unassigned" ? null : assignee;
  const search = p.get("search");
  if (search) filter.search = search;
  const from = p.get("from");
  if (from && !Number.isNaN(Date.parse(from))) filter.createdFrom = new Date(from);
  const to = p.get("to");
  if (to && !Number.isNaN(Date.parse(to))) {
    const d = new Date(to);
    d.setDate(d.getDate() + 1);
    filter.createdTo = d;
  }

  return Response.json(await ticketService.list(filter));
}
