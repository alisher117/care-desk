"use client";

import { useCallback, useEffect, useState } from "react";
import { careDeskConfig } from "../../config/config";
import { adminApi } from "../api";
import { durationHuman, initials } from "../format";
import { useLabels } from "../labels-context";
import { PRIORITY_COLORS, STATUS_COLORS, priorityLabel, statusLabel } from "../status";
import type { MetricsDto, TicketPriority, TicketStatus } from "../types";
import DatePicker from "./DatePicker";
import { AVATAR, CARD, CARD_TITLE, LABEL, PRIMARY_BUTTON, TABLE_HEAD, TABLE_ROW } from "./styles";

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export default function OverviewView() {
  const { labels, locale } = useLabels();
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return isoDay(d);
  });
  const [to, setTo] = useState(() => isoDay(new Date()));
  const [metrics, setMetrics] = useState<MetricsDto | null>(null);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    try {
      setMetrics(await adminApi.metrics(from, to));
      setDenied(false);
    } catch {
      setDenied(true);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  if (denied) {
    return <div className="text-sm font-medium text-gray-600">{labels.commonOperatorAccessRequired}</div>;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="ml-auto flex flex-wrap items-end gap-2">
          <div>
            <span className={LABEL}>{labels.commonFrom}</span>
            <DatePicker ariaLabel={labels.commonFrom} align="right" className="mt-1" value={from} onChange={setFrom} />
          </div>
          <div>
            <span className={LABEL}>{labels.commonTo}</span>
            <DatePicker ariaLabel={labels.commonTo} align="right" className="mt-1" value={to} onChange={setTo} />
          </div>
          <a
            href={adminApi.exportUrl(from, to)}
            className={PRIMARY_BUTTON}
            style={{ backgroundColor: careDeskConfig.branding.primaryColor }}
          >
            {labels.overviewExportExcel}
          </a>
        </div>
      </div>

      {metrics && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label={labels.overviewStatOpened} value={String(metrics.opened)} />
            <Stat label={labels.overviewStatResolved} value={String(metrics.resolved)} />
            <Stat label={labels.overviewStatClosed} value={String(metrics.closed)} />
            <Stat label={labels.commonAvgFirstAction} value={durationHuman(metrics.avgFirstActionSec, locale)} />
            <Stat label={labels.overviewStatAvgResolution} value={durationHuman(metrics.avgResolutionSec, locale)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Breakdown
              title={labels.overviewByStatus}
              data={metrics.byStatus}
              labeler={(k) => statusLabel(labels, k)}
              colorer={(k) => STATUS_COLORS[k as TicketStatus]}
              emptyLabel={labels.overviewNoData}
            />
            <Breakdown
              title={labels.overviewByPriority}
              data={metrics.byPriority}
              labeler={(k) => priorityLabel(labels, k)}
              colorer={(k) => PRIORITY_COLORS[k as TicketPriority]}
              emptyLabel={labels.overviewNoData}
            />
            <Breakdown title={labels.overviewByCategory} data={metrics.byCategory} emptyLabel={labels.overviewNoData} />
          </div>

          <div className={`${CARD} overflow-hidden`}>
            <p className={`px-4 pt-4 pb-3 ${CARD_TITLE}`}>{labels.overviewByOperator}</p>
            <table className="w-full text-sm">
              <thead>
                <tr className={TABLE_HEAD}>
                  <th className="px-4 py-2">{labels.commonOperator}</th>
                  <th className="px-4 py-2">{labels.commonHandled}</th>
                  <th className="px-4 py-2">{labels.commonAvgFirstAction}</th>
                </tr>
              </thead>
              <tbody>
                {metrics.byOperator.map((o) => (
                  <tr key={o.operatorId} className={TABLE_ROW}>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-2 text-gray-900">
                        <span className={AVATAR}>{initials(o.displayName ?? o.operatorId)}</span>
                        {o.displayName ?? o.operatorId}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{o.handled}</td>
                    <td className="px-4 py-2 text-gray-600">{durationHuman(o.avgFirstActionSec, locale)}</td>
                  </tr>
                ))}
                {metrics.byOperator.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center font-medium text-gray-400">
                      {labels.overviewNoAssigned}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
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

function Breakdown({
  title,
  data,
  labeler = (k: string) => k,
  colorer,
  emptyLabel,
}: {
  title: string;
  data: Record<string, number>;
  labeler?: (key: string) => string;
  colorer?: (key: string) => string | undefined;
  emptyLabel: string;
}) {
  const entries = Object.entries(data);
  return (
    <div className={`${CARD} p-4`}>
      <p className={`mb-3 ${CARD_TITLE}`}>{title}</p>
      {entries.length === 0 && <p className="text-xs font-medium text-gray-400">{emptyLabel}</p>}
      <ul className="space-y-1.5">
        {entries.map(([k, v]) => {
          const color = colorer?.(k);
          return (
            <li key={k} className="flex items-center justify-between text-[13px] font-medium">
              <span className="inline-flex items-center gap-1.5 capitalize text-gray-700">
                {color && (
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
                {labeler(k)}
              </span>
              <span
                className="rounded-xl px-2 py-0.5 text-gray-900"
                style={color ? { color, backgroundColor: `${color}14` } : undefined}
              >
                {v}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
