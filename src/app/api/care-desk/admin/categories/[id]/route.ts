import type { Category } from "@/care-desk/core";
import { categoryService } from "@/care-desk/core";
import "@/care-desk/host/init";
import { operatorDenied, requireOperator } from "@/care-desk/host/route-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Gate = { response: Response; category?: never } | { response?: never; category: Category };

async function gate(req: Request, params: Promise<{ id: string }>): Promise<Gate> {
  const op = await requireOperator(req);
  if (!op) return { response: await operatorDenied() };
  if (!op.identity.moderator) {
    return {
      response: Response.json({ error: "category changes require admin" }, { status: 403 }),
    };
  }
  const { id } = await params;
  const category = UUID.test(id) ? await categoryService.getCategory(id) : null;
  if (!category || category.archivedAt) {
    return { response: Response.json({ error: "not found" }, { status: 404 }) };
  }
  return { category };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await gate(req, params);
  if (g.response) return g.response;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.requesterVisible !== "boolean") {
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }
  return Response.json(await categoryService.setRequesterVisible(g.category.id, body.requesterVisible));
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await gate(req, params);
  if (g.response) return g.response;
  return Response.json(await categoryService.archiveCategory(g.category.id));
}
