import type { Notifier } from "../core";
import { careDeskConfig } from "../config/config";
import { DASHBOARD_PATH } from "../web/routes";
import { emailCopy } from "./email-copy";
import {
  renderStatusEmail,
  renderTicketAssignedEmail,
  renderTicketCreatedEmail,
  type EmailTheme,
} from "./email-template";
import { BRAND, appUrl, sendRenderedEmail } from "./mailer";
import { getOperatorContact } from "./operator-directory";

// Tickets do not record the requester's language, so mail to requesters and
// to the shared inbox goes out in the desk's default locale.
const DEFAULT_LOCALE = careDeskConfig.defaultLocale;

const theme: EmailTheme = {
  accentColor: careDeskConfig.branding.primaryColor,
  logoUrl: careDeskConfig.branding.logoUrl,
};

const ticketNumber = (n: number) => `#${String(n).padStart(3, "0")}`;

const ticketUrl = (locale: string, ticketId: string) =>
  appUrl(`/${locale}${DASHBOARD_PATH}/${ticketId}`);

export const careDeskNotifier: Notifier = {
  async notifyCreated({ ticket }) {
    const to = process.env.CARE_DESK_NOTIFY_EMAIL?.trim();
    if (!to) return;

    try {
      const mail = renderTicketCreatedEmail({
        brand: BRAND,
        copy: emailCopy(DEFAULT_LOCALE),
        theme,
        number: ticketNumber(ticket.number),
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category ?? undefined,
        requesterName: ticket.requesterName,
        requesterEmail: ticket.requesterEmail ?? undefined,
        requesterPhone: ticket.requesterPhone ?? undefined,
        url: ticketUrl(DEFAULT_LOCALE, ticket.id),
      });
      await sendRenderedEmail(to, mail);
    } catch (err) {
      console.error("[care-desk] new ticket notification failed", err);
    }
  },

  async notifyStatusChange({ ticket, to, comment }) {
    if (!ticket.requesterEmail) return;

    try {
      const mail = renderStatusEmail({
        brand: BRAND,
        copy: emailCopy(DEFAULT_LOCALE),
        theme,
        requesterName: ticket.requesterName,
        number: ticketNumber(ticket.number),
        subject: ticket.subject,
        status: to,
        comment,
      });
      await sendRenderedEmail(ticket.requesterEmail, mail);
    } catch (err) {
      console.error("[care-desk] status notification failed", err);
    }
  },

  async notifyAssigned({ ticket, operator }) {
    try {
      const contact = await getOperatorContact(operator.hostUserId);
      if (!contact?.email) return;

      const locale = contact.locale || DEFAULT_LOCALE;
      const mail = renderTicketAssignedEmail({
        brand: BRAND,
        copy: emailCopy(locale),
        theme,
        operatorName: operator.displayName ?? contact.name,
        number: ticketNumber(ticket.number),
        subject: ticket.subject,
        priority: ticket.priority,
        requesterName: ticket.requesterName,
        dueDate: ticket.dueDate,
        url: ticketUrl(locale, ticket.id),
      });
      await sendRenderedEmail(contact.email, mail);
    } catch (err) {
      console.error("[care-desk] assignment notification failed", err);
    }
  },
};
