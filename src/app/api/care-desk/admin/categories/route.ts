import { z } from "zod";
import { CategoryExistsError, categoryService } from "@/care-desk/core";
import "@/care-desk/host/init";
import { operatorDenied, requireOperator } from "@/care-desk/host/route-guards";
import { CATEGORY_NAME_MAX } from "@/care-desk/web/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  name: z.string().trim().min(2).max(CATEGORY_NAME_MAX),
});

export async function GET(req: Request) {
  const op = await requireOperator(req);
  if (!op) return operatorDenied();
  return Response.json(await categoryService.listCategories());
}

export async function POST(req: Request) {
  const op = await requireOperator(req);
  if (!op) return operatorDenied();
  if (!op.identity.moderator) {
    return Response.json({ error: "category changes require admin" }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });

  try {
    return Response.json(await categoryService.createCategory(parsed.data.name), { status: 201 });
  } catch (err) {
    if (err instanceof CategoryExistsError) {
      return Response.json({ error: "exists" }, { status: 409 });
    }
    throw err;
  }
}
