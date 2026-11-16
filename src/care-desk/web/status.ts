import type { DashboardLabels } from "../config/labels";
import { TicketPriority, TicketStatus } from "./types";

const TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  open: ["resolved", "pending", "closed"],
  pending: ["open", "resolved", "closed"],
  resolved: ["open", "closed"],
  closed: ["open"],
}

export function nextStatuses(from: TicketStatus): TicketStatus[] {
  return [...(TRANSITIONS[from] ?? [])]
}

export const STATUS_LABEL_KEYS: Record<TicketStatus, keyof DashboardLabels> = {
  open: "statusOpen",
  pending: "statusPending",
  resolved: "statusResolved",
  closed: "statusClosed",
}

export function statusLabel(labels: DashboardLabels, status: string): string {
  const key = STATUS_LABEL_KEYS[status as TicketStatus];
  return key ? labels[key] : status;
}

export const STATUS_COLORS: Record<TicketStatus, string> = {
  open: "#2563eb",
  pending: "#a16207",
  resolved: "#16a34a",
  closed: "#6b7280",
}

export const PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

export const PRIORITY_LABEL_KEYS: Record<TicketPriority, keyof DashboardLabels> = {
  low: "priorityLow",
  medium: "priorityMedium",
  high: "priorityHigh",
  urgent: "priorityUrgent",
}

export function priorityLabel(labels: DashboardLabels, priority: string): string {
  const key = PRIORITY_LABEL_KEYS[priority as TicketPriority];
  return key ? labels[key] : priority;
}

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: "#6b7280",
  medium: "#a16207",
  high: "#ea580c",
  urgent: "#dc2626",
}
