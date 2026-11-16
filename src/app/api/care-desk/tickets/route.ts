import { categoryService, ticketService } from "@/care-desk/core";
import "@/care-desk/host/init";
import { requireRequester } from "@/care-desk/host/route-guards";
import {
  CATEGORY_REQUIRED_MESSAGE,
  CATEGORY_UNAVAILABLE_MESSAGE,
  ticketFormSchema,
} from "@/care-desk/web/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function categoryIssue(message: string): Response {
  return Response.json({ error: "invalid", issues: { category: [message] } }, { status: 400 });
}

export async function POST(req: Request) {
  const requester = await requireRequester(req);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const payload = await req.json().catch(() => null);
  const parsed = ticketFormSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  let category: string | null = null;
  if (parsed.data.category) {
    const resolved = await categoryService.resolveCategory(parsed.data.category, { requesterOnly: true });
    if (resolved.reason) return categoryIssue(CATEGORY_UNAVAILABLE_MESSAGE);
    category = resolved.category.name;
  } else if ((await categoryService.listRequesterCategories()).length > 0) {
    return categoryIssue(CATEGORY_REQUIRED_MESSAGE);
  }

  const profile = requester.profile ?? {};
  const phone = typeof profile.phone === "string" ? profile.phone : null;

  const ticket = await ticketService.create({
    requesterId: requester.id,
    requesterName: requester.displayName,
    requesterEmail: requester.email ?? null,
    requesterPhone: phone,
    requesterProfile: requester.profile ?? null,
    subject: parsed.data.subject,
    description: parsed.data.description,
    category,
  });

  return Response.json(ticket, { status: 201 });
}
