"use client"


import { useCallback, useEffect, useState } from "react";
import { careDeskConfig } from "../../config/config";
import { fmt, type DashboardLabels } from "../../config/labels";
import { ApiError, adminApi } from "../api";
import { dateTimeShort, initials } from "../format";
import { useLabels } from "../labels-context";
import {
  PRIORITIES,
  PRIORITY_COLORS,
  STATUS_COLORS,
  nextStatuses,
  priorityLabel,
  statusLabel,
} from "../status";
import type { CategoryDto, OperatorDto, TicketDto, TicketNoteDto, TicketPriority, TicketStatus } from "../types";
import DatePicker from "./DatePicker";
import FilterSelect from "./FilterSelect";
import { CARD, CARD_TITLE, FIELD, LABEL, PRIMARY_BUTTON, TEXT_LINK } from "./styles";

const num = (n: number) => `#${String(n).padStart(3, "0")}`;

function failureMessage(err: unknown, labels: DashboardLabels): string {
  console.error("[care-desk] ticket request failed", err);
  return err instanceof ApiError
    ? fmt(labels.errWithStatus, { message: labels.errRequestFailed, status: err.status })
    : labels.errRequestFailed;
}

const READ_ONLY_VALUE =
  "mt-1 truncate rounded-2xl bg-[#FAFAFB] px-4 py-2 text-sm font-medium text-gray-700";

const PROFILE_LABEL_KEYS: Partial<Record<string, keyof DashboardLabels>> = {
  phone: "detailProfilePhone",
};

function operatorLabel(labels: DashboardLabels, o: OperatorDto): string {
  const name = o.displayName ?? o.hostUserId;
  return o.active ? name : fmt(labels.commonOperatorInactive, { name });
}

function assigneeLabel(
  labels: DashboardLabels,
  operators: OperatorDto[],
  id: string | null | undefined,
): string {
  if (!id) return labels.commonUnassigned;
  const o = operators.find((x) => x.id === id);
  if (!o) return "-";
  return operatorLabel(labels, o);
}

function categoryLabel(labels: DashboardLabels, categories: CategoryDto[], name: string): string {
  return categories.some((c) => c.archivedAt && c.name === name)
    ? fmt(labels.commonCategoryArchived, { name })
    : name;
}

export default function TicketDetail({
  ticketId,
  canAssign,
  onBack,
}: {
  ticketId: string;
  canAssign: boolean;
  onBack: () => void;
}) {
  const { labels, locale } = useLabels();
  const [ticket, setTicket] = useState<TicketDto | null>(null);
  const [notes, setNotes] = useState<TicketNoteDto[]>([]);
  const [operators, setOperators] = useState<OperatorDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [pendingStatus, setPendingStatus] = useState<TicketStatus | null>(null);
  const [statusComment, setStatusComment] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [myOperatorId, setMyOperatorId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [tk, ns, me] = await Promise.all([
        adminApi.ticket(ticketId),
        adminApi.notes(ticketId),
        adminApi.me(),
      ]);
      setTicket(tk);
      setPendingStatus(tk.status);
      setNotes(ns);
      setMyOperatorId(me.operatorId);
    } catch {
      setNotFound(true);
    }
  }, [ticketId]);


  useEffect(() => {
    void load();
    adminApi.operators().then(setOperators).catch(() => setOperators([]))
    adminApi.categories().then(setCategories).catch(() => setCategories([]))
  }, [load]);

  async function patch(fn: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setActionError(failureMessage(err, labels));
    } finally {
      setBusy(false);
    }
  }

  async function addNote() {
    if (!noteDraft.trim() || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await adminApi.addNote(ticketId, noteDraft.trim());
      setNoteDraft("");
      await load();
    } catch (err) {
      setActionError(failureMessage(err, labels));
    } finally {
      setBusy(false)
    }
  }

  async function sendStatus() {
    if (!ticket || busy) return;
    const status = pendingStatus ?? ticket.status;
    const comment = statusComment.trim();
    if (status === ticket.status || !comment) return;
    await patch(async () => {
      await adminApi.changeStatus(ticketId, status, comment);
      setStatusComment("");
    });
  }

  if (notFound) {
    return (
      <div>
        <button onClick={onBack} className={TEXT_LINK}>
          {labels.detailBackToTickets}
        </button>
        <p className="mt-4 text-sm font-medium text-gray-600">{labels.detailNotFound}</p>
      </div>
    )
  }

  if (!ticket) {
    return <div className="text-sm font-medium text-gray-400">{labels.commonLoading}</div>
  }

  const profile = ticket.requesterProfile ?? {};
  const dueValue = ticket.dueDate ? ticket.dueDate.slice(0, 10) : "";
  const selectedStatus = pendingStatus ?? ticket.status;
  const statusChanged = selectedStatus !== ticket.status;
  const commentEmpty = statusComment.trim() === "";
  const canEdit = canAssign || (myOperatorId !== null && ticket.assignedOperatorId === myOperatorId);
  const profileLabel = (key: string) => {
    const labelKey = PROFILE_LABEL_KEYS[key];
    return labelKey ? labels[labelKey] : key;
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <button onClick={onBack} className={`mb-4 ${TEXT_LINK}`}>
        {labels.detailBackToTickets}
      </button>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <div className={`${CARD} p-4`}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[13px] font-medium text-gray-500">{num(ticket.number)}</span>
              <span
                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[13px] font-medium transition-colors duration-200 ease-out"
                style={{ color: STATUS_COLORS[ticket.status], backgroundColor: `${STATUS_COLORS[ticket.status]}14` }}
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[ticket.status] }}
                />
                {statusLabel(labels, ticket.status)}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[13px] font-medium transition-colors duration-200 ease-out"
                style={{ color: PRIORITY_COLORS[ticket.priority], backgroundColor: `${PRIORITY_COLORS[ticket.priority]}14` }}
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: PRIORITY_COLORS[ticket.priority] }}
                />
                {priorityLabel(labels, ticket.priority)}
              </span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">{ticket.subject}</h1>
            <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-gray-700">{ticket.description}</p>
            <p className="mt-3 text-xs font-medium text-gray-400">
              {fmt(labels.detailOpenedAt, { date: dateTimeShort(ticket.createdAt, locale) })}
            </p>
          </div>

          <div className={`${CARD} overflow-hidden`}>
            <p className="px-4 pt-4 pb-2 text-sm font-medium text-gray-900">
              {labels.detailNotesTitle}
            </p>
            <div className="space-y-2 px-4 pb-4">
              {notes.length === 0 && (
                <p className="text-xs font-medium text-gray-400">
                  {labels.detailNotesEmpty}
                </p>
              )}
              {notes.map((n) => {
                const client = n.kind === "client";
                return (
                  <div
                    key={n.id}
                    className={`rounded-xl px-3 py-2 text-sm font-medium ${client ? "bg-blue-50 text-blue-900" : "bg-amber-50 text-amber-900"}`}
                  >
                    {client && (
                      <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-blue-700">
                        {labels.detailNoteSentToRequester}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap break-words">{n.body}</div>
                    <div className={`mt-1 text-[10px] ${client ? "text-blue-700" : "text-amber-700"}`}>
                      {dateTimeShort(n.createdAt, locale)}
                    </div>
                  </div>
                );
              })}
            </div>
            {canEdit ? (
              <div className="bg-[#FAFAFB] p-4">
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder={labels.detailNotePlaceholder}
                  rows={2}
                  className={`${FIELD} resize-none`}
                />
                <button
                  onClick={() => void addNote()}
                  disabled={busy || !noteDraft.trim()}
                  className={`mt-2 ${PRIMARY_BUTTON}`}
                  style={{ backgroundColor: careDeskConfig.branding.primaryColor }}
                >
                  {labels.detailAddNote}
                </button>
                {actionError && <p className="mt-1 text-xs font-medium text-red-600">{actionError}</p>}
              </div>
            ) : (
              <p className="bg-[#FAFAFB] px-4 py-3 text-xs font-medium text-gray-500">
                {labels.detailReadOnlyHint}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className={`${CARD} p-4`}>
            <p className={`mb-3 ${CARD_TITLE}`}>{labels.commonContact}</p>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[11px] font-medium text-gray-700">
                {initials(ticket.requesterName)}
              </span>
              <p className="text-sm font-medium text-gray-900">{ticket.requesterName}</p>
            </div>
            {ticket.requesterPhone && (
              <p className="mt-2 text-sm font-medium text-gray-700">
                <a
                  href={`tel:${ticket.requesterPhone}`}
                  className="transition-colors duration-200 ease-out hover:text-brand"
                >
                  {ticket.requesterPhone}
                </a>
              </p>
            )}

            {ticket.requesterEmail && (
              <p className="mt-1 text-sm font-medium text-gray-700">
                <a
                  href={`mailto:${ticket.requesterEmail}`}
                  className="transition-colors duration-200 ease-out hover:text-brand"
                >
                  {ticket.requesterEmail}
                </a>
              </p>
            )}

            {Object.entries(profile).length > 0 && (
              <div className="mt-3 space-y-1 rounded-xl bg-[#FAFAFB] px-3 py-2 text-xs font-medium text-gray-600">
                {Object.entries(profile).map(([k, v]) => (
                  <p key={k}>
                    <span className="text-gray-400">{profileLabel(k)}:</span>{" "}
                    {typeof v === "string" ? v : JSON.stringify(v)}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className={`${CARD} space-y-2 p-4`}>
            <p className={CARD_TITLE}>{labels.detailTriageTitle}</p>

            {!canEdit && (
              <p className="rounded-xl bg-brand/8 px-3 py-2 text-xs font-medium text-brand">
                {labels.detailReadOnlyHint}
              </p>
            )}

            <div>
              <span className={LABEL}>{labels.commonStatus}</span>
              {canEdit ? (
                <FilterSelect
                  ariaLabel={labels.commonStatus}
                  className="mt-1 w-full"
                  value={selectedStatus}
                  onChange={(v) => setPendingStatus(v as TicketStatus)}
                  disabled={busy}
                  options={[ticket.status, ...nextStatuses(ticket.status)].map((st) => ({
                    value: st,
                    label: statusLabel(labels, st),
                    color: STATUS_COLORS[st],
                  }))}
                />
              ) : (
                <p className={READ_ONLY_VALUE} style={{ color: STATUS_COLORS[ticket.status] }}>
                  {statusLabel(labels, ticket.status)}
                </p>
              )}
            </div>

            {canEdit && statusChanged && (
              <div className="space-y-2 rounded-xl bg-[#FAFAFB] p-3">
                <label className={LABEL}>
                  {labels.detailStatusCommentLabel}
                  <textarea
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    rows={3}
                    autoFocus
                    disabled={busy}
                    className={`${FIELD} mt-1 resize-none`}
                  />
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void sendStatus()}
                    disabled={busy || commentEmpty}
                    className={PRIMARY_BUTTON}
                    style={{ backgroundColor: careDeskConfig.branding.primaryColor }}
                  >
                    {labels.detailSend}
                  </button>
                  {commentEmpty && (
                    <span className="text-[11px] font-medium text-gray-500">
                      {labels.detailCommentRequired}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className={LABEL}>{labels.commonPriority}</span>
                {canEdit ? (
                  <FilterSelect
                    ariaLabel={labels.commonPriority}
                    className="mt-1 w-full"
                    value={ticket.priority}
                    onChange={(v) =>
                      void patch(() => adminApi.update(ticketId, { priority: v as TicketPriority }))
                    }
                    disabled={busy}
                    options={PRIORITIES.map((pr) => ({
                      value: pr,
                      label: priorityLabel(labels, pr),
                      color: PRIORITY_COLORS[pr],
                    }))}
                  />
                ) : (
                  <p className={READ_ONLY_VALUE} style={{ color: PRIORITY_COLORS[ticket.priority] }}>
                    {priorityLabel(labels, ticket.priority)}
                  </p>
                )}
              </div>
              <div>
                <span className={LABEL}>{labels.commonCategory}</span>
                {canEdit ? (
                  <FilterSelect
                    ariaLabel={labels.commonCategory}
                    className="mt-1 w-full"
                    placeholder={labels.detailNoCategory}
                    value={ticket.category ?? ""}
                    onChange={(v) => void patch(() => adminApi.update(ticketId, { category: v || null }))}
                    disabled={busy}
                    options={[
                      ...categories
                        .filter((c) => !c.archivedAt)
                        .map((c) => ({ value: c.name, label: c.name })),
                      ...(ticket.category &&
                      !categories.some((c) => !c.archivedAt && c.name === ticket.category)
                        ? [
                            {
                              value: ticket.category,
                              label: categoryLabel(labels, categories, ticket.category),
                              disabled: true,
                            },
                          ]
                        : []),
                    ]}
                  />
                ) : (
                  <p className={READ_ONLY_VALUE}>
                    {ticket.category ? categoryLabel(labels, categories, ticket.category) : labels.detailNoCategory}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className={LABEL}>{labels.commonAssignedTo}</span>
                {canAssign ? (
                  <FilterSelect
                    ariaLabel={labels.commonAssignedTo}
                    className="mt-1 w-full"
                    placeholder={labels.commonUnassigned}
                    value={ticket.assignedOperatorId ?? ""}
                    onChange={(v) =>
                      void patch(() => adminApi.update(ticketId, { assignedOperatorId: v || null }))
                    }
                    disabled={busy}
                    options={operators
                      .filter((o) => o.active || o.id === ticket.assignedOperatorId)
                      .map((o) => ({
                        value: o.id,
                        label: operatorLabel(labels, o),
                      }))}
                  />
                ) : (
                  <p className={READ_ONLY_VALUE} title={labels.detailAssigneeAdminOnly}>
                    {assigneeLabel(labels, operators, ticket.assignedOperatorId)}
                  </p>
                )}
              </div>
              <div>
                <span className={LABEL}>{labels.commonDueDate}</span>
                {canEdit ? (
                  <DatePicker
                    ariaLabel={labels.commonDueDate}
                    align="right"
                    className="mt-1 w-full"
                    placeholder={labels.detailNoDueDate}
                    clearable
                    value={dueValue}
                    onChange={(v) =>
                      void patch(() =>
                        adminApi.update(ticketId, { dueDate: v ? new Date(v).toISOString() : null }),
                      )
                    }
                    disabled={busy}
                  />
                ) : (
                  <p className={READ_ONLY_VALUE}>
                    {ticket.dueDate ? dateTimeShort(ticket.dueDate, locale) : labels.detailNoDueDate}
                  </p>
                )}
              </div>
            </div>

            {actionError && <p className="text-xs font-medium text-red-600">{actionError}</p>}

            <a href={adminApi.recordUrl(ticketId)} className={`pt-1 text-xs ${TEXT_LINK}`}>
              {labels.detailDownloadRecord}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
