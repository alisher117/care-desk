import "@/care-desk/host/init";
import { listOperatorsWithAccess } from "@/care-desk/host/operator-directory";
import { operatorDenied, requireOperator } from "@/care-desk/host/route-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const op = await requireOperator(req);
  if (!op) return operatorDenied();
  return Response.json(await listOperatorsWithAccess());
}
