import "@/care-desk/host/init";
import { operatorDenied, requireOperator } from "@/care-desk/host/route-guards";
import { exportService } from "@/care-desk/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const op = await requireOperator(req);
  if (!op) return operatorDenied();

  const { id } = await params;
  const text = await exportService.ticketRecord(id);
  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="care-desk-ticket-${id}.txt"`,
    },
  });
}
