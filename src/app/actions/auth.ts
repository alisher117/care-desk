"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import * as z from "zod";
import { LoginFormSchema, SetupFormSchema, type FormState } from "@/app/lib/definitions";
import { careDeskConfig } from "@/care-desk/config/config";
import { createSession, deleteSession } from "../lib/session";
import { createFirstAccount, findUserForLogin } from "@/care-desk/host/users";
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


const DUMMY_HASH = '$2b$12$R9cxizC5JEiFPxtB5t.FKuCTYu1UQXymXRAZOy5BJEM648TOJIPie';

function safeLocale(value: unknown): string {
  const locale = String(value ?? "");
  return careDeskConfig.locales.includes(locale) ? locale : careDeskConfig.defaultLocale;
}

export async function login( state: FormState, formData: FormData ): Promise<FormState> {
  const email = String(formData.get('email') ?? '');
  const values = { email };
  
  const parsed = LoginFormSchema.safeParse({ email, password: String(formData.get('password') ?? '') });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const user = await findUserForLogin(parsed.data.email);
  const password_confirm = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !password_confirm) {
    return { message: 'invalid email or password', values};
  }

  await createSession(user.id)
  redirect(`/${safeLocale(formData.get("locale"))}${DASHBOARD_PATH}`);
}

export async function logout(locale: string): Promise<void> {
  await deleteSession();
  redirect(`/${safeLocale(locale)}/login`);
}