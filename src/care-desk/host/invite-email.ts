import { careDeskConfig } from "../config/config";
import { emailCopy } from "./email-copy";
import { renderInviteEmail } from "./email-template";
import { BRAND, emailEnabled, sendRenderedEmail } from "./mailer";

export type InviteEmailStatus = 'sent' | 'skipped' | 'failed';

export async function sendInviteEmail(input: {
  to: string;
  inviterName: string;
  role: "operator" | "admin";
  url: string;
  expiresAt: Date;
  locale: string;
}): Promise<InviteEmailStatus> {
  if (!emailEnabled) return "skipped";
  try {
    const mail = renderInviteEmail({
      brand: BRAND,
      copy: emailCopy(input.locale),
      theme: {
        accentColor: careDeskConfig.branding.primaryColor,
        logoUrl: careDeskConfig.branding.logoUrl,
      },
      inviterName: input.inviterName,
      role: input.role,
      url: input.url,
      expiresAt: input.expiresAt,
    });
    await sendRenderedEmail(input.to, mail);
    return "sent";
  } catch (err) {
    console.error("[care-desk] invite email failed", err);
    return "failed";
  }
}