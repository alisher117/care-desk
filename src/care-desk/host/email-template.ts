import fs from "node:fs";
import path from "node:path";
import type { Attachment } from "nodemailer/lib/mailer";
import type { TicketPriority, TicketStatus } from "../core";
import type { EmailCopy } from "./email-copy";

const LOGO_CID = "logo@care-desk";
const DEFAULT_ACCENT = "#111827";

export interface EmailTheme {
  /** Button and link colour. */
  accentColor?: string;
  /** PNG or JPEG under /public (e.g. "/logo.png"). Without it the brand name is shown as text. */
  logoUrl?: string;
}

interface EmailBase {
  brand: string;
  copy: EmailCopy;
  theme?: EmailTheme;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match,
  );
}

/** Fills a template for HTML: every value is escaped, the template itself is trusted copy. */
function fillHtml(template: string, vars: Record<string, string>): string {
  const escaped: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) escaped[k] = escapeHtml(v);
  return fill(escapeHtml(template), escaped);
}

function loadLogoAttachment(logoUrl: string | undefined): Attachment[] {
  if (!logoUrl || !/\.(png|jpe?g)$/i.test(logoUrl)) return [];
  try {
    const p = path.join(process.cwd(), "public", logoUrl.replace(/^\/+/, ""));
    const content = fs.readFileSync(p);
    return [{ filename: path.basename(p), content, cid: LOGO_CID }];
  } catch (err) {
    console.error("[care-desk] logo attachment unavailable, sending without it:", err);
    return [];
  }
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
  attachments: Attachment[];
}

interface ShellInput extends EmailBase {
  subject: string;
  heading: string;
  rows: string;
  text: string;
}

function renderShell({ brand, copy, theme, subject, heading, rows, text }: ShellInput): RenderedEmail {
  const attachments = loadLogoAttachment(theme?.logoUrl);
  const header = attachments.length
    ? `<img src="cid:${LOGO_CID}" alt="${escapeHtml(brand)}" height="32" style="height: 32px;" />`
    : `<span style="font-size: 20px; font-weight: 700; color: #111827;">${escapeHtml(brand)}</span>`;
  const html = `
<!DOCTYPE html>
<html lang="${copy.lang}">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; background-color: #f0f0f0; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f0f0; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; padding: 48px 40px 60px;">
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              ${header}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 16px; color: #374151; font-weight: 600;">${escapeHtml(heading)}</p>
            </td>
          </tr>${rows}
          <tr>
            <td align="center">
              <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 1.6;">
                ${fillHtml(copy.footer, { brand })}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
  return { subject, text, html, attachments };
}

function paragraphRow(html: string, paddingBottom = 12): string {
  return `
          <tr>
            <td align="center" style="padding-bottom: ${paddingBottom}px;">
              <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${html}</p>
            </td>
          </tr>`;
}

function headlineRow(text: string): string {
  return `
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <span style="font-size: 28px; font-weight: 700; color: #111827;">${escapeHtml(text)}</span>
            </td>
          </tr>`;
}

function panelRow(label: string, bodyHtml: string): string {
  return `
          <tr>
            <td align="left" style="padding-bottom: 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px; text-align: left;">
                    <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af; font-weight: 600;">${escapeHtml(label)}</p>
                    <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${bodyHtml}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

function buttonRow(label: string, url: string, base: EmailBase): string {
  const href = escapeHtml(url);
  const accent = escapeHtml(base.theme?.accentColor ?? DEFAULT_ACCENT);
  return `
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <a href="${href}" style="display: inline-block; background-color: ${accent}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">${escapeHtml(label)}</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6; word-break: break-all;">${escapeHtml(base.copy.buttonFallback)} <a href="${href}" style="color: ${accent};">${href}</a></p>
            </td>
          </tr>`;
}

export interface StatusEmailInput extends EmailBase {
  requesterName: string;
  number: string;
  subject: string;
  status: TicketStatus;
  comment?: string;
}

export function renderStatusEmail(input: StatusEmailInput): RenderedEmail {
  const { brand, copy, requesterName, number, subject, comment } = input;
  const status = copy.status[input.status];
  const trimmed = comment?.trim() || undefined;

  const text =
    `${fill(copy.greeting, { name: requesterName })}\n` +
    `\n` +
    `${fill(copy.statusText, { number, subject, status })}\n` +
    (trimmed ? `\n` + `${copy.commentLabel}\n` + `${trimmed}\n` : "") +
    `\n` +
    `${fill(copy.footer, { brand })}\n`;

  const rows =
    paragraphRow(fillHtml(copy.statusTicketLine, { number, subject })) +
    headlineRow(status) +
    (trimmed ? panelRow(copy.commentLabel, escapeHtml(trimmed).replace(/\r?\n/g, "<br>")) : "");

  return renderShell({
    ...input,
    subject: fill(copy.statusSubject, { brand, number }),
    heading: copy.statusHeading,
    rows,
    text,
  });
}

export interface TicketCreatedEmailInput extends EmailBase {
  number: string;
  subject: string;
  description: string;
  category?: string;
  requesterName: string;
  requesterEmail?: string;
  requesterPhone?: string;
  url: string;
}

export function renderTicketCreatedEmail(input: TicketCreatedEmailInput): RenderedEmail {
  const { brand, copy, number, subject, description, category, requesterName, requesterEmail, requesterPhone, url } = input;
  const body = description.trim();
  const openLabel = fill(copy.openInDesk, { brand });
  const replyNote = fill(copy.createdReplyNote, { brand });

  const details =
    `${copy.requester}: ${requesterName}\n` +
    (requesterEmail ? `${copy.email}: ${requesterEmail}\n` : "") +
    (requesterPhone ? `${copy.phone}: ${requesterPhone}\n` : "") +
    (category ? `${copy.category}: ${category}\n` : "");

  const text =
    `${fill(copy.createdText, { brand, number, subject })}\n` +
    `\n` +
    details +
    `\n` +
    `${copy.descriptionLabel}\n` +
    `${body}\n` +
    `\n` +
    `${openLabel}: ${url}\n` +
    `\n` +
    `${replyNote}\n` +
    `\n` +
    `${fill(copy.footer, { brand })}\n`;

  const detailsHtml =
    `${escapeHtml(copy.requester)}: <strong>${escapeHtml(requesterName)}</strong>` +
    (requesterEmail ? `<br>${escapeHtml(copy.email)}: ${escapeHtml(requesterEmail)}` : "") +
    (requesterPhone ? `<br>${escapeHtml(copy.phone)}: ${escapeHtml(requesterPhone)}` : "") +
    (category ? `<br>${escapeHtml(copy.category)}: ${escapeHtml(category)}` : "");

  const rows =
    paragraphRow(fillHtml(copy.createdIntro, { brand })) +
    headlineRow(number) +
    paragraphRow(fillHtml(copy.quoted, { text: subject }), 24) +
    panelRow(copy.detailsLabel, detailsHtml) +
    panelRow(copy.descriptionLabel, escapeHtml(body).replace(/\r?\n/g, "<br>")) +
    buttonRow(openLabel, url, input) +
    paragraphRow(escapeHtml(replyNote), 32);

  return renderShell({
    ...input,
    subject: fill(copy.createdSubject, { brand, number }),
    heading: fill(copy.createdHeading, { brand }),
    rows,
    text,
  });
}

export interface TicketAssignedEmailInput extends EmailBase {
  /** Falls back to the locale's word for "colleague". */
  operatorName?: string | null;
  number: string;
  subject: string;
  priority: TicketPriority;
  requesterName: string;
  dueDate?: Date | null;
  url: string;
}

export function renderTicketAssignedEmail(input: TicketAssignedEmailInput): RenderedEmail {
  const { brand, copy, number, subject, requesterName, url } = input;
  const greeting = fill(copy.greeting, { name: input.operatorName || copy.colleague });
  const priority = copy.priority[input.priority];
  const dueDate = input.dueDate
    ? input.dueDate.toLocaleDateString(copy.dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" })
    : undefined;

  const details =
    `${copy.priorityLabel}: ${priority}\n` +
    `${copy.requester}: ${requesterName}\n` +
    (dueDate ? `${copy.due}: ${dueDate}\n` : "");

  const text =
    `${greeting}\n` +
    `\n` +
    `${fill(copy.assignedText, { number, subject })}\n` +
    `\n` +
    details +
    `\n` +
    `${copy.openRequest}: ${url}\n` +
    `\n` +
    `${fill(copy.footer, { brand })}\n`;

  const detailsHtml =
    `${escapeHtml(copy.priorityLabel)}: <strong>${escapeHtml(priority)}</strong><br>` +
    `${escapeHtml(copy.requester)}: ${escapeHtml(requesterName)}` +
    (dueDate ? `<br>${escapeHtml(copy.due)}: ${escapeHtml(dueDate)}` : "");

  const rows =
    paragraphRow(escapeHtml(greeting)) +
    paragraphRow(escapeHtml(copy.assignedIntro)) +
    headlineRow(number) +
    paragraphRow(fillHtml(copy.quoted, { text: subject }), 24) +
    panelRow(copy.detailsLabel, detailsHtml) +
    buttonRow(copy.openRequest, url, input);

  return renderShell({
    ...input,
    subject: fill(copy.assignedSubject, { brand, number }),
    heading: copy.assignedHeading,
    rows,
    text,
  });
}
