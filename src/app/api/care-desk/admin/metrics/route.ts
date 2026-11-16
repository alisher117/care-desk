import "@/care-desk/host/init";
import { operatorDenied, requireOperator } from "@/care-desk/host/route-guards";
import { metricsService } from "@/care-desk/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const op = await requireOperator(req);
  if (!op) return operatorDenied();

  const p = new URL(req.url).searchParams;
  const fromStr = p.get("from");
  const toStr = p.get("to");
  if (!fromStr || !toStr || Number.isNaN(Date.parse(fromStr)) || Number.isNaN(Date.parse(toStr))) {
    return Response.json({ error: "from/to required (YYYY-MM-DD)" }, { status: 400 });
  }
  const from = new Date(fromStr);
  const to = new Date(toStr);
  to.setDate(to.getDate() + 1);

  return Response.json(await metricsService.compute({ from, to }));
}
