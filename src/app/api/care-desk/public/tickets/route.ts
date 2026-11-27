import { categoryService, ticketService } from "@/care-desk/core";
import { allowPublicSubmission, clientIp } from "@/care-desk/host/public-rate-limit";
import "@/care-desk/host/init";
import {
  CATEGORY_REQUIRED_MESSAGE,
  CATEGORY_UNAVAILABLE_MESSAGE,
  publicTicketFormSchema,
} from "@/care-desk/web/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function categoryIssue(message: string): Response {
  return Response.json(
    { error: "invalid", issues: { category: [message] } },
    { status: 400 },
  );
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
   if (payload && typeof payload.contact_fax === "string" && payload.contact_fax.trim() !== "") {
    return Response.json({ number: 0 }, { status: 201 });
  }
  const parsed = publicTicketFormSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { name, email, subject, description } = parsed.data;
  const phone = parsed.data.phone || null;

  let category: string | null = null;
  if (parsed.data.category) {
    const resolved = await categoryService.resolveCategory(
      parsed.data.category,
      { requesterOnly: true },
    );
    if (resolved.reason) return categoryIssue(CATEGORY_UNAVAILABLE_MESSAGE);
    category = resolved.category.name;
  } else if ((await categoryService.listRequesterCategories()).length > 0) {
    return categoryIssue(CATEGORY_REQUIRED_MESSAGE);
  }

    if (!(await allowPublicSubmission(clientIp(req), email))) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }

  const ticket = await ticketService.create({
    requesterId: `email:${email}`,
    requesterName: name,
    requesterEmail: email,
    requesterPhone: phone,
    requesterProfile: phone ? { phone } : null,
    subject,
    description,
    category,
  });
  return Response.json({ number: ticket.number }, { status: 201 });
}
