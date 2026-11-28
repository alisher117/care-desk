import { DASHBOARD_PATH, LOGIN_PATH } from "./routes";
import type {
  CategoryDto,
  MeDto,
  MetricsDto,
  OperatorDto,
  TicketDto,
  TicketNoteDto,
  TicketPriority,
  TicketStatus,
  WidgetCategoryDto,
} from "./types";
import type { publicTicketFormValues } from "./validation";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly reason?: string,
    public readonly issues?: Record<string, string[]>,
  ) {
    super(`Care Desk API error ${status}`);
    this.name = "ApiError";
  }
}

const SESSION_END_REASONS = new Set(["session_idle", "session_ended"]);

export const ACTIVITY_POLL_HEADERS = { "x-activity": "poll" };

function leaveForLogin(reason: string): void {
  const path = window.location.pathname;
  const at = path.indexOf(DASHBOARD_PATH);
  const prefix = at >= 0 ? path.slice(0, at) : "";
  window.location.assign(`${prefix}${LOGIN_PATH}?error=${reason}`);
}

async function json<T>(res: Response, leaveOnSessionEnd = false): Promise<T> {
  if (!res.ok) {
    let reason: string | undefined;
    let issues: Record<string, string[]> | undefined;
    let sessionEnd: string | undefined;
    try {
      const body = (await res.json()) as { error?: unknown; issues?: unknown; reason?: unknown };
      if (typeof body?.error === "string") reason = body.error;
      if (body?.issues && typeof body.issues === "object") {
        issues = body.issues as Record<string, string[]>;
      }
      if (typeof body?.reason === "string" && SESSION_END_REASONS.has(body.reason)) {
        sessionEnd = body.reason;
      }
    } catch {
    }
    if (leaveOnSessionEnd && sessionEnd && LOGIN_PATH && typeof window !== "undefined") {
      leaveForLogin(sessionEnd);
      return new Promise<T>(() => {});
    }
    throw new ApiError(res.status, reason, issues);
  }
  return (await res.json()) as T;
}

function dashboardJson<T>(res: Response): Promise<T> {
  return json<T>(res, true);
}

const base = "/api/care-desk";

export const widgetApi = {
  categories: () =>
    fetch(`${base}/public/categories`).then((r) => json<WidgetCategoryDto[]>(r)),

  submit: (values: publicTicketFormValues & { contact_fax?: string }) =>
    fetch(`${base}/public/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    }).then((r) => json<{ number: number }>(r)),
};

export interface AdminTicketFilter {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignedOperatorId?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface TicketUpdate {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string | null;
  assignedOperatorId?: string | null;
  dueDate?: string | null;
  comment?: string;
}

export const adminApi = {
  tickets: (filter: AdminTicketFilter = {}, opts: { poll?: boolean } = {}) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filter)) {
      if (v !== undefined && v !== "") q.set(k, String(v));
    }
    const qs = q.toString();
    return fetch(
      `${base}/admin/tickets${qs ? `?${qs}` : ""}`,
      opts.poll ? { headers: ACTIVITY_POLL_HEADERS } : undefined,
    ).then((r) => dashboardJson<TicketDto[]>(r));
  },

  ticket: (id: string) =>
    fetch(`${base}/admin/tickets/${id}`).then((r) => dashboardJson<TicketDto>(r)),

  update: (id: string, patch: TicketUpdate) =>
    fetch(`${base}/admin/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then((r) => dashboardJson<TicketDto>(r)),

  changeStatus: (id: string, status: TicketStatus, comment: string) =>
    fetch(`${base}/admin/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, comment }),
    }).then((r) => dashboardJson<TicketDto>(r)),

  notes: (id: string) =>
    fetch(`${base}/admin/tickets/${id}/notes`).then((r) => dashboardJson<TicketNoteDto[]>(r)),

  addNote: (id: string, body: string) =>
    fetch(`${base}/admin/tickets/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    }).then((r) => dashboardJson<TicketDto>(r)),

  operators: () =>
    fetch(`${base}/admin/operators`).then((r) => dashboardJson<OperatorDto[]>(r)),

  categories: () => fetch(`${base}/admin/categories`).then((r) => dashboardJson<CategoryDto[]>(r)),

  createCategory: (name: string) =>
    fetch(`${base}/admin/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then((r) => dashboardJson<CategoryDto>(r)),

  updateCategory: (id: string, patch: { requesterVisible: boolean }) =>
    fetch(`${base}/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then((r) => dashboardJson<CategoryDto>(r)),

  archiveCategory: (id: string) =>
    fetch(`${base}/admin/categories/${id}`, { method: "DELETE" }).then((r) => dashboardJson<CategoryDto>(r)),

  me: () => fetch(`${base}/admin/me`).then((r) => dashboardJson<MeDto>(r)),

  metrics: (from: string, to: string) =>
    fetch(`${base}/admin/metrics?from=${from}&to=${to}`).then((r) => dashboardJson<MetricsDto>(r)),

  exportUrl: (from: string, to: string) => `${base}/admin/export?from=${from}&to=${to}`,
  recordUrl: (id: string) => `${base}/admin/tickets/${id}/record`,
};
