"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import * as z from "zod";
import { SetupFormSchema, type FormState } from "@/app/lib/definitions";
import { careDeskConfig } from "@/care-desk/config/config";
import { createSession } from "../lib/session";
import { createFirstAccount } from "@/care-desk/host/users";
import { DASHBOARD_PATH } from "@/care-desk/web/routes";

export async function setup(
  state: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const values = { name, email };

  const parsed = SetupFormSchema.safeParse({
    name,
    email,
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await createFirstAccount({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
  });
  if (!user) {
    return { message: "The setup is already complete", values };
  }

  await createSession(user.id);
  const locale = String(formData.get("locale") ?? "");
  const safeLocale = careDeskConfig.locales.includes(locale)
    ? locale
    : careDeskConfig.defaultLocale;
  redirect(`/${safeLocale}${DASHBOARD_PATH}`);
}
