"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../api";
import { dateTimeShort, durationHuman, initials } from "../format";
import { useLabels } from "../labels-context";
import { PRIORITY_COLORS, STATUS_COLORS, priorityLabel, statusLabel } from "../status";
import type { MeDto, MetricsDto, TicketDto } from "../types";
import DatePicker from "./DatePicker";
import { CARD, CARD_TITLE, LABEL, TABLE_HEAD, TABLE_ROW } from "./styles";

const num = (n: number) => `#${String(n).padStart(3, "0")}`;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export default function AccountView({ onOpen }: { onOpen: (id: string) => void }) {
  const { labels, locale: labelsLocale } = useLabels();
  const [me, setMe] = useState<MeDto | null>(null);
  const [denied, setDenied] = useState(false);
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [metrics, setMetrics] = useState<MetricsDto | null>(null);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return isoDay(d);
  });
  const [to, setTo] = useState(() => isoDay(new Date()));

  useEffect(() => {
    adminApi
      .me()
      .then((profile) => {
        setMe(profile);
        setDenied(false);
      })
      .catch(() => setDenied(true));
  }, []);

  useEffect(() => {
    if (!me) return;
    adminApi
      .tickets({ assignedOperatorId: me.operatorId })
      .then(setTickets)
      .catch(() => setTickets([]));
  }, [me]);

  const loadMetrics = useCallback(async () => {
    if (!me) return;
    try {
      setMetrics(await adminApi.metrics(from, to));
    } catch {
      setMetrics(null);
    }
  }, [me, from, to]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  if (denied) {
    return <div className="text-sm font-medium text-gray-600">{labels.commonOperatorAccessRequired}</div>;
  }

  if (!me) {
    return <div className="text-sm font-medium text-gray-400">{labels.commonLoading}</div>;
  }

  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "pending");
  const mine = metrics?.byOperator.find((o) => o.operatorId === me.operatorId);
  const subtitle = [me.position, me.department].filter(Boolean).join(" · ");

  return (
    <div className="w-full space-y-6">
      <div className={`${CARD} p-5`}>
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700">
            {initials(me.displayName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-gray-900">{me.displayName}</p>
            <p className="text-sm font-medium text-gray-500">{subtitle || "—"}</p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={labels.accountEmail} value={me.email} />
          <Field label={labels.accountPhone} value={me.phone} />
          <Field label={labels.accountRole} value={me.role} className="capitalize" />
          <Field label={labels.accountDepartment} value={me.department} />
          <Field label={labels.accountPosition} value={me.position} />
          <Field
            label={labels.accountLastSignIn}
            value={me.lastLoginAt ? dateTimeShort(me.lastLoginAt, labelsLocale) : null}
          />
        </dl>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <p className={CARD_TITLE}>{labels.accountMyWork}</p>
          <div className="ml-auto flex flex-wrap items-end gap-2">
            <div>
              <span className={LABEL}>{labels.commonFrom}</span>
              <DatePicker ariaLabel={labels.commonFrom} align="right" className="mt-1" value={from} onChange={setFrom} />
            </div>
            <div>
              <span className={LABEL}>{labels.commonTo}</span>
              <DatePicker ariaLabel={labels.commonTo} align="right" className="mt-1" value={to} onChange={setTo} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label={labels.accountOpenNow} value={String(openTickets.length)} />
          <Stat label={labels.commonHandled} value={String(mine?.handled ?? 0)} />
          <Stat
            label={labels.commonAvgFirstAction}
            value={durationHuman(mine?.avgFirstActionSec ?? null, labelsLocale)}
          />
        </div>

        <div className={`${CARD} overflow-hidden`}>
          <p className={`px-4 pt-4 pb-3 ${CARD_TITLE}`}>{labels.accountMyTicketsTitle}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className={TABLE_HEAD}>
                  <th className="px-4 py-2">{labels.commonTicketId}</th>
                  <th className="px-4 py-2">{labels.commonSubject}</th>
                  <th className="px-4 py-2">{labels.commonPriority}</th>
                  <th className="px-4 py-2">{labels.commonStatus}</th>
                  <th className="px-4 py-2">{labels.commonDueDate}</th>
                  <th className="px-4 py-2">{labels.accountColUpdated}</th>
                </tr>
              </thead>
              <tbody>
                {openTickets.map((tk) => (
                  <tr
                    key={tk.id}
                    onClick={() => onOpen(tk.id)}
                    className={`${TABLE_ROW} cursor-pointer hover:bg-gray-50`}
                  >
                    <td className="px-4 py-2 text-gray-500">{num(tk.number)}</td>
                    <td className="max-w-xs truncate px-4 py-2 text-gray-900">{tk.subject}</td>
                    <td className="px-4 py-2">
                      <Pill label={priorityLabel(labels, tk.priority)} color={PRIORITY_COLORS[tk.priority]} />
                    </td>
                    <td className="px-4 py-2">
                      <Pill label={statusLabel(labels, tk.status)} color={STATUS_COLORS[tk.status]} />
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {tk.dueDate ? dateTimeShort(tk.dueDate, labelsLocale) : "-"}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{dateTimeShort(tk.updatedAt, labelsLocale)}</td>
                  </tr>
                ))}
                {openTickets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center font-medium text-gray-400">
                      {labels.accountNothingAssigned}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div>
      <dt className={LABEL}>{label}</dt>
      <dd className={`mt-0.5 text-sm font-medium text-gray-900 ${className ?? ""}`}>{value || "—"}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${CARD} p-4`}>
      <p className={CARD_TITLE}>{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[13px] font-medium transition-colors duration-200 ease-out"
      style={{ color, backgroundColor: `${color}14` }}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
