import type {
  CategoryRejection,
  TicketPriority,
  TicketStatus,
  UpdateTicketInput,
} from "@/care-desk/core";
import { InvalidTransitionError, categoryService, ticketService } from "@/care-desk/core";
import "@/care-desk/host/init";
import { operatorDenied, requireOperator } from "@/care-desk/host/route-guards";
import { canEditTicket } from "@/care-desk/host/ticket-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["open", "pending", "resolved", "closed"]);
const PRIORITIES = new Set(["low", "medium", "high", "urgent"]);
const COMMENT_MAX = 4000;
const CATEGORY_ERRORS: Record<CategoryRejection, string> = {
  unknown: "unknown category",
  archived: "category is archived",
  hidden: "category is hidden",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const op = await requireOperator(req);
  if (!op) return operatorDenied();

  const { id } = await params;
  const ticket = await ticketService.get(id);
  if (!ticket) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(ticket);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const op = await requireOperator(req);
  if (!op) return operatorDenied();

  const { id } = await params;
  const current = await ticketService.get(id);
  if (!current) return Response.json({ error: "not found" }, { status: 404 });
  if (!canEditTicket(op, current)) {
    return Response.json({ error: "not your ticket" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "invalid payload" }, { status: 400 });

  const changes: UpdateTicketInput = {};

  if ("status" in body) {
    if (typeof body.status !== "string" || !STATUSES.has(body.status)) {
      return Response.json({ error: "bad status" }, { status: 400 });
    }
    changes.status = body.status as TicketStatus;
  }

  let comment: string | undefined;
  if ("comment" in body) {
    if (typeof body.comment !== "string") {
      return Response.json({ error: "bad comment" }, { status: 400 });
    }
    comment = body.comment.trim();
    if (comment.length > COMMENT_MAX) {
      return Response.json({ error: "comment too long" }, { status: 400 });
    }
  }
  if ("status" in body) {
    if (!comment) {
      return Response.json({ error: "comment required with status change" }, { status: 400 });
    }
    changes.comment = comment;
  } else if ("comment" in body) {
    return Response.json({ error: "comment requires a status change" }, { status: 400 });
  }

  if ("priority" in body) {
    if (typeof body.priority !== "string" || !PRIORITIES.has(body.priority)) {
      return Response.json({ error: "bad priority" }, { status: 400 });
    }
    changes.priority = body.priority as TicketPriority;
  }
  if ("category" in body) {
    if (body.category === null) {
      changes.category = null;
    } else if (typeof body.category !== "string" || !body.category.trim()) {
      return Response.json({ error: "bad category" }, { status: 400 });
    } else {
      const resolved = await categoryService.resolveCategory(body.category, { requesterOnly: false });
      if (resolved.reason) {
        return Response.json({ error: CATEGORY_ERRORS[resolved.reason] }, { status: 400 });
      }
      changes.category = resolved.category.name;
    }
  }
  if ("assignedOperatorId" in body) {
    if (!op.identity.moderator) {
      return Response.json({ error: "assignment requires admin" }, { status: 403 });
    }
    changes.assignedOperatorId =
      body.assignedOperatorId === null ? null : String(body.assignedOperatorId);
  }
  if ("dueDate" in body) {
    if (body.dueDate === null) {
      changes.dueDate = null;
    } else if (typeof body.dueDate === "string" && !Number.isNaN(Date.parse(body.dueDate))) {
      changes.dueDate = new Date(body.dueDate);
    } else {
      return Response.json({ error: "bad dueDate" }, { status: 400 });
    }
  }

  try {
    const ticket = await ticketService.update(id, changes, {
      type: "operator",
      id: op.operator.id,
    });
    return Response.json(ticket);
  } catch (err) {
    if (err instanceof InvalidTransitionError) {
      return Response.json(
        { error: `cannot move from ${err.from} to ${err.to}` },
        { status: 400 },
      );
    }
    throw err;
  }
}
