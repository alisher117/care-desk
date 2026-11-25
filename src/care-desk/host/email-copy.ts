import type { TicketPriority, TicketStatus } from "../core";

// Email wording per locale. {placeholders} are filled by email-template.ts.
// A locale without an entry here gets English.
export interface EmailCopy {
  lang: string;
  dateLocale: string;
  footer: string;
  buttonFallback: string;
  greeting: string;
  colleague: string;
  status: Record<TicketStatus, string>;
  priority: Record<TicketPriority, string>;

  statusSubject: string;
  statusHeading: string;
  statusText: string;
  statusTicketLine: string;
  commentLabel: string;

  createdSubject: string;
  createdHeading: string;
  createdIntro: string;
  createdText: string;
  createdReplyNote: string;
  openInDesk: string;

  assignedSubject: string;
  assignedHeading: string;
  assignedIntro: string;
  assignedText: string;
  openRequest: string;

  roles: Record<"operator" | "admin", string>;
  inviteSubject: string;
  inviteHeading: string;
  inviteIntro: string;
  inviteButton: string;
  inviteExpiry: string;

  detailsLabel: string;
  descriptionLabel: string;
  requester: string;
  email: string;
  phone: string;
  category: string;
  priorityLabel: string;
  due: string;
  quoted: string;
}

const en: EmailCopy = {
  lang: "en",
  dateLocale: "en-GB",
  footer: "This is an automated notification from {brand}.",
  buttonFallback: "If the button doesn't work, open this link:",
  greeting: "Hello, {name}!",
  colleague: "colleague",
  status: { open: "Open", pending: "Pending", resolved: "Resolved", closed: "Closed" },
  priority: { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" },

  statusSubject: "{brand} — request {number}: status updated",
  statusHeading: "The status of your request was updated",
  statusText: "The status of your request {number} “{subject}” changed to {status}.",
  statusTicketLine: "Request {number} “{subject}”",
  commentLabel: "Operator's comment:",

  createdSubject: "{brand} — new request {number}",
  createdHeading: "New request in {brand}",
  createdIntro: "A new request has come in to {brand}",
  createdText: "A new request {number} “{subject}” has come in to {brand}.",
  createdReplyNote: "Reply to the requester and change the status only in {brand}.",
  openInDesk: "Open in {brand}",

  assignedSubject: "{brand} — request {number} was assigned to you",
  assignedHeading: "A new request was assigned to you",
  assignedIntro: "You have been assigned a request",
  assignedText: "You have been assigned request {number} “{subject}”.",
  openRequest: "Open request",

  roles: { operator: "operator", admin: "admin" },
  inviteSubject: "You're invited to {brand}",
  inviteHeading: "You're invited to {brand}",
  inviteIntro: "{inviter} invited you to join {brand} as {role}.",
  inviteButton: "Accept invite",
  inviteExpiry: "This link works once and expires on {date}.",

  detailsLabel: "Request details:",
  descriptionLabel: "Description:",
  requester: "Requester",
  email: "Email",
  phone: "Phone",
  category: "Category",
  priorityLabel: "Priority",
  due: "Due",
  quoted: "“{text}”",
};

const ru: EmailCopy = {
  lang: "ru",
  dateLocale: "ru-RU",
  footer: "Это автоматическое уведомление службы поддержки {brand}.",
  buttonFallback: "Если кнопка не работает, откройте ссылку:",
  greeting: "Здравствуйте, {name}!",
  colleague: "коллега",
  status: { open: "«Открыто»", pending: "«В обработке»", resolved: "«Решено»", closed: "«Закрыто»" },
  priority: { low: "Низкий", medium: "Средний", high: "Высокий", urgent: "Срочный" },

  statusSubject: "{brand} — обращение {number}: статус обновлён",
  statusHeading: "Статус вашего обращения обновлён",
  statusText: "Статус вашего обращения {number} «{subject}» изменён: {status}.",
  statusTicketLine: "Обращение {number} «{subject}»",
  commentLabel: "Комментарий оператора:",

  createdSubject: "{brand} — новое обращение {number}",
  createdHeading: "Новое обращение в {brand}",
  createdIntro: "В {brand} поступило новое обращение",
  createdText: "В {brand} поступило новое обращение {number} «{subject}».",
  createdReplyNote: "Ответ заявителю и смена статуса — только в {brand}.",
  openInDesk: "Открыть в {brand}",

  assignedSubject: "{brand} — вам назначено обращение {number}",
  assignedHeading: "Новое обращение назначено вам",
  assignedIntro: "Вам назначено обращение",
  assignedText: "Вам назначено обращение {number} «{subject}».",
  openRequest: "Открыть обращение",

    roles: { operator: "оператор", admin: "администратор" },
  inviteSubject: "Приглашение в {brand}",
  inviteHeading: "Вас пригласили в {brand}",
  inviteIntro: "{inviter} приглашает вас в {brand}. Ваша роль: {role}.",
  inviteButton: "Принять приглашение",
  inviteExpiry: "Ссылка одноразовая и действует до {date}.",

  detailsLabel: "Детали обращения:",
  descriptionLabel: "Описание:",
  requester: "Заявитель",
  email: "Email",
  phone: "Телефон",
  category: "Категория",
  priorityLabel: "Приоритет",
  due: "Срок",
  quoted: "«{text}»",
};

const COPY: Record<string, EmailCopy> = { en, ru };

export function emailCopy(locale: string | null | undefined): EmailCopy {
  return (locale && COPY[locale]) || en;
}
