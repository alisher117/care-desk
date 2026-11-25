import nodemailer from "nodemailer";
import { careDeskConfig } from "../config/config";
import type { RenderedEmail } from "./email-template";

export const BRAND = careDeskConfig.name;

const smtpHost = process.env.SMTP_HOST?.trim();

const transporter = smtpHost
  ? nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    })
  : null;


  export const emailEnabled = transporter !== null;

export async function sendRenderedEmail(to: string, mail: RenderedEmail): Promise<void> {
  if (!transporter) {
    console.info(`[care-desk] SMTP not configured, email skipped: "${mail.subject}" -> ${to}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    attachments: mail.attachments,
  });
}

export function appUrl(path: string): string {
  const base = (process.env.APP_URL ?? "").replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
