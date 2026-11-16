import "@/care-desk/host/init";
import { operatorDenied, requireOperator } from "@/care-desk/host/route-guards";
import { canEditTicket } from "@/care-desk/host/ticket-access";
import { noteService, ticketService } from "@/care-desk/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 4000;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const op = await requireOperator(req);
  if (!op) return operatorDenied();

  const { id } = await params;
  return Response.json(await noteService.list(id));
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const op = await requireOperator(req);
  if (!op) return operatorDenied();

  const { id } = await params;
  const ticket = await ticketService.get(id);
  if (!ticket) return Response.json({ error: "not found" }, { status: 404 });
  if (!canEditTicket(op, ticket)) {
    return Response.json({ error: "not your ticket" }, { status: 403 });
  }

  const payload = (await req.json().catch(() => null)) as { body?: string } | null;
  const body = payload?.body?.trim();
  if (!body || body.length > MAX) {
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }

  const note = await noteService.add(id, op.operator.id, body);
  return Response.json(note, { status: 201 });
}
