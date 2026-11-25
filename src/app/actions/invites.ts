"use server";

import { careDeskConfig } from "@/care-desk/config/config";
import { createInvite, revokeInvite } from "@/care-desk/host/invites";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import * as z from "zod";
import { InvitedFormSchema, InviteState } from "../lib/definitions";
import { getCurrentUser } from "./auth";
import { sendInviteEmail } from "@/care-desk/host/invite-email";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export async function createInviteAction(
  locale: string,
  state: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Only admins can invite users" };

  const email = String(formData.get("email") ?? "");
  const parsed = InvitedFormSchema.safeParse({
    email,
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Enter a valid email address", email };

  const result = await createInvite({ ...parsed.data, invitedBy: admin.id });
  if ("error" in result)
    return { error: "That email already has an account.", email };

const safeLocale = careDeskConfig.locales.includes(locale) ? locale : careDeskConfig.defaultLocale;
  const origin = (await headers()).get("origin") ?? process.env.APP_URL ?? "";
  const link = `${origin}/${safeLocale}/invite/${result.token}`;

  const emailStatus = await sendInviteEmail({
    to: result.invite.email,
    inviterName: admin.name,
    role: result.invite.role,
    url: link,
    expiresAt: result.invite.expiresAt,
    locale: safeLocale,
  });

  revalidatePath("/", "layout");
  return { link, email: parsed.data.email, emailStatus };
}
