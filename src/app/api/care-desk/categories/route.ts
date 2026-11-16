import { categoryService } from "@/care-desk/core";
import "@/care-desk/host/init";
import { requireRequester } from "@/care-desk/host/route-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const requester = await requireRequester(req);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(await categoryService.listRequesterCategories());
}
