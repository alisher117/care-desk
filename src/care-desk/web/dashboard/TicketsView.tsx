"use client"

import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fmt, type DashboardLabels } from "../../config/labels";
import { adminApi, type AdminTicketFilter } from "../api";
import { dateTimeShort, initials } from "../format";
import { useLabels } from "../labels-context";
import {
  PRIORITIES,
  PRIORITY_COLORS,
  STATUS_COLORS,
  priorityLabel,
  statusLabel,
} from "../status";
import type { CategoryDto, OperatorDto, TicketDto, TicketPriority, TicketStatus } from "../types";
import FilterSelect from "./FilterSelect";

const POLL_MS = 20000;
const NAME_PLACEHOLDER = "{name}";
const num = (n: number) => `#${String(n).padStart(3, "0")}`;

function operatorLabel(labels: DashboardLabels, o: OperatorDto): string {
  const name = o.displayName ?? o.hostUserId;
  return o.active ? name : fmt(labels.commonOperatorInactive, { name });
}

function Assignee({ operator, assigned }: { operator?: OperatorDto; assigned: boolean }) {
  const { labels } = useLabels();
  if (!operator) {
    return (
      <span className="font-medium text-gray-400">{assigned ? "-" : labels.commonUnassigned}</span>
    );
  }
  const name = operator.displayName ?? operator.hostUserId;
  const template = labels.commonOperatorInactive;
  const at = template.indexOf(NAME_PLACEHOLDER);
  const before = at >= 0 ? template.slice(0, at).trim() : "";
  const after = at >= 0 ? template.slice(at + NAME_PLACEHOLDER.length).trim() : template.trim();
  return (
    <span className={`inline-flex items-center gap-2 font-medium ${operator.active ? "text-gray-900" : "text-gray-400"}`}>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-700">
        {initials(name)}
      </span>
      {!operator.active && before && <span className="text-[11px] text-gray-400">{before}</span>}
      {name}
      {!operator.active && after && <span className="text-[11px] text-gray-400">{after}</span>}
    </span>
  );
}

export default function TicketsView({ onOpen }: { onOpen: (id: string) => void }) {
  const { labels, locale } = useLabels();
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [category, setCategory] = useState("");
  const [assignee, setAssignee] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [operators, setOperators] = useState<OperatorDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);

  const operatorsById = useMemo(
    () => new Map(operators.map((o) => [o.id, o])),
    [operators],
  );

  const filter: AdminTicketFilter = useMemo(
    () => ({
      status: status || undefined,
      priority: priority || undefined,
      category: category || undefined,
      assignedOperatorId: assignee || undefined,
      search: search.trim() || undefined,
    }),
    [status, priority, category, assignee, search],
  );

  const load = useCallback(async (poll = false) => {
    try {
      setTickets(await adminApi.tickets(filter, { poll }));
      setDenied(false);
    } catch {
      setDenied(true);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(true), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    adminApi.operators().then(setOperators).catch(() => setOperators([]));
    adminApi.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  if (denied) {
    return (
      <div className="text-sm text-gray-600">
        {labels.ticketsAccessDenied}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative inline-flex items-center text-gray-400 transition-colors duration-200 ease-out focus-within:text-brand">
          <Search size={16} className="pointer-events-none absolute left-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={labels.ticketsSearchPlaceholder}
            className="min-w-56 max-w-66 pointer-events-auto rounded-2xl border border-gray-100 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 outline-none transition-all duration-200 ease-out placeholder:text-gray-400 hover:border-gray-300 focus:border-brand focus:bg-brand/8 focus:text-brand focus:caret-brand focus:placeholder:text-brand/50"
          />
        </div>

        <FilterSelect
          ariaLabel={labels.commonStatus}
          placeholder={labels.ticketsFilterStatusAll}
          value={status}
          onChange={(v) => setStatus(v as TicketStatus | "")}
          options={(["open", "pending", "resolved", "closed"] as TicketStatus[]).map((s) => ({
            value: s,
            label: statusLabel(labels, s),
            color: STATUS_COLORS[s],
          }))}
        />

        <FilterSelect
          ariaLabel={labels.commonPriority}
          placeholder={labels.ticketsFilterPriorityAll}
          value={priority}
          onChange={(v) => setPriority(v as TicketPriority | "")}
          options={PRIORITIES.map((p) => ({
            value: p,
            label: priorityLabel(labels, p),
            color: PRIORITY_COLORS[p],
          }))}
        />

        <FilterSelect
          ariaLabel={labels.commonCategory}
          placeholder={labels.ticketsFilterCategoryAll}
          value={category}
          onChange={setCategory}
          options={categories.map((c) => ({
            value: c.name,
            label: c.archivedAt ? fmt(labels.commonCategoryArchived, { name: c.name }) : c.name,
          }))}
        />

        <FilterSelect
          ariaLabel={labels.commonAssignedTo}
          placeholder={labels.ticketsFilterAssignedAll}
          value={assignee}
          onChange={setAssignee}
          options={[
            { value: "unassigned", label: labels.commonUnassigned },
            ...operators.map((o) => ({
              value: o.id,
              label: operatorLabel(labels, o),
            })),
          ]}
        />
      </div>


      <div className="overflow-x-auto rounded-lg bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b bg-[#FAFAFB] text-[#6E6E6E] border-gray-200 text-left text-[11px] uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2 font-medium">{labels.commonTicketId}</th>
              <th className="px-4 py-2 font-medium">{labels.commonSubject}</th>
              <th className="px-4 py-2 font-medium">{labels.commonPriority}</th>
              <th className="px-4 py-2 font-medium">{labels.commonDueDate}</th>
              <th className="px-4 py-2 font-medium">{labels.commonCategory}</th>
              <th className="px-4 py-2 font-medium">{labels.commonStatus}</th>
              <th className="px-4 py-2 font-medium">{labels.commonContact}</th>
              <th className="px-4 py-2 font-medium">{labels.commonAssignedTo}</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((tk) => (
              <tr
                key={tk.id}
                onClick={() => onOpen(tk.id)}
                className="cursor-pointer border-b border-gray-100 text-[13px] last:border-0 hover:bg-gray-50"
              >
                <td className="px-4 py-2 font-medium text-[13px] text-gray-500">{num(tk.number)}</td>
                <td className="max-w-xs truncate font-medium px-4 text-[13px] py-2 text-gray-900">{tk.subject}</td>
                <td className="px-4 py-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[13px] font-medium transition-colors duration-200 ease-out"
                    style={{ color: PRIORITY_COLORS[tk.priority], backgroundColor: `${PRIORITY_COLORS[tk.priority]}14` }}
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200 ease-out"
                      style={{ backgroundColor: PRIORITY_COLORS[tk.priority] }}
                    />
                    {priorityLabel(labels, tk.priority)}
                  </span>
                </td>
                <td className="px-4 py-2 text-[13px] font-medium text-gray-600">
                  {tk.dueDate ? dateTimeShort(tk.dueDate, locale) : "-"}
                </td>
                <td className="px-4 py-2 text-[13px] font-medium text-gray-600">{tk.category ?? "-"}</td>
                <td className="px-4 text-[13px] py-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[13px] font-medium transition-colors duration-200 ease-out"
                    style={{ color: STATUS_COLORS[tk.status], backgroundColor: `${STATUS_COLORS[tk.status]}14` }}
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200 ease-out"
                      style={{ backgroundColor: STATUS_COLORS[tk.status] }}
                    />
                    {statusLabel(labels, tk.status)}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-2 font-medium text-gray-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-700">
                      {initials(tk.requesterName)}
                    </span>
                    {tk.requesterName}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <Assignee
                    operator={operatorsById.get(tk.assignedOperatorId ?? "")}
                    assigned={Boolean(tk.assignedOperatorId)}
                  />
                </td>
              </tr>
            ))}
            {!loading && tickets.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center font-medium text-gray-400">
                  {labels.ticketsEmpty}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center font-medium text-gray-400">
                  {labels.commonLoading}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
