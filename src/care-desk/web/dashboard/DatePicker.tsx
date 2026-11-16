"use client"

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { localeTag, weekdaysShort } from "../format";
import { useLabels } from "../labels-context";

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

function parseIso(value: string): { y: number; m: number; d: number } | null {
  const [y, m, d] = value.split("-").map(Number);
  return y && m && d ? { y, m, d } : null;
}

function monthGrid(y: number, m: number) {
  const first = new Date(y, m - 1, 1);
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m, 0).getDate();
  const daysInPrev = new Date(y, m - 1, 0).getDate();
  const cells: { y: number; m: number; d: number; outside: boolean }[] = [];
  for (let i = lead - 1; i >= 0; i--) {
    const prev = new Date(y, m - 2, 1);
    cells.push({ y: prev.getFullYear(), m: prev.getMonth() + 1, d: daysInPrev - i, outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ y, m, d, outside: false });
  while (cells.length % 7 !== 0) {
    const next = new Date(y, m, 1);
    cells.push({ y: next.getFullYear(), m: next.getMonth() + 1, d: cells.length - lead - daysInMonth + 1, outside: true });
  }
  return cells;
}

export default function DatePicker({
  value,
  onChange,
  ariaLabel,
  placeholder,
  className,
  disabled = false,
  clearable = false,
  align = "left",
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  align?: "left" | "right";
}) {
  const { labels, locale } = useLabels();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const weekdays = useMemo(() => weekdaysShort(locale), [locale]);
  const tag = localeTag(locale);

  const selected = parseIso(value);
  const today = new Date();
  const todayIso = toIso(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const [view, setView] = useState(() => ({
    y: selected?.y ?? today.getFullYear(),
    m: selected?.m ?? today.getMonth() + 1,
  }));

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const current = parseIso(value);
    setView({
      y: current?.y ?? today.getFullYear(),
      m: current?.m ?? today.getMonth() + 1,
    });
    setOpen(true);
  }

  function shiftMonth(delta: number) {
    setView((v) => {
      const next = new Date(v.y, v.m - 1 + delta, 1);
      return { y: next.getFullYear(), m: next.getMonth() + 1 };
    });
  }

  function pick(iso: string) {
    setOpen(false);
    triggerRef.current?.focus();
    if (iso !== value) onChange(iso);
  }

  const label = selected
    ? new Date(selected.y, selected.m - 1, selected.d).toLocaleDateString(tag, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : (placeholder ?? labels.commonPickDate);

  const monthLabel = new Date(view.y, view.m - 1, 1).toLocaleDateString(tag, {
    month: "long",
    year: "numeric",
  });

  return (
    <div ref={rootRef} className={`relative inline-block ${className ?? ""}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className={`inline-flex w-full cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2 text-sm outline-none transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${
          open
            ? "border-brand bg-brand/8 text-brand"
            : "border-gray-100 bg-white text-gray-700 hover:border-gray-300 active:bg-brand/8 active:text-brand focus-visible:border-brand focus-visible:bg-brand/8 focus-visible:text-brand"
        }`}
      >
        <Calendar
          size={16}
          className={`shrink-0 transition-colors duration-200 ease-out ${open ? "text-brand" : "text-gray-400"}`}
        />
        <span className={selected ? "" : "text-gray-400"}>{label}</span>
      </button>

      <div
        role="dialog"
        aria-label={ariaLabel}
        inert={!open}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            triggerRef.current?.focus();
          }
        }}
        className={`absolute top-full z-50 mt-2 w-72 rounded-2xl ${align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"} border border-gray-100 bg-white p-3 shadow-lg transition-all duration-200 ease-out ${
          open
            ? "visible translate-y-0 scale-100 opacity-100"
            : "invisible -translate-y-1 scale-95 opacity-0"
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label={labels.commonPrevMonth}
            onClick={() => shiftMonth(-1)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-gray-500 outline-none transition-colors duration-150 ease-out hover:bg-gray-50 hover:text-brand focus-visible:bg-gray-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium capitalize text-gray-900">{monthLabel}</span>
          <button
            type="button"
            aria-label={labels.commonNextMonth}
            onClick={() => shiftMonth(1)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-gray-500 outline-none transition-colors duration-150 ease-out hover:bg-gray-50 hover:text-brand focus-visible:bg-gray-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {weekdays.map((w, i) => (
            <span
              key={i}
              className="py-1 text-center text-[10px] font-medium uppercase tracking-wide text-gray-400"
            >
              {w}
            </span>
          ))}
          {monthGrid(view.y, view.m).map((c) => {
            const iso = toIso(c.y, c.m, c.d);
            const isSelected = iso === value;
            const isToday = iso === todayIso;
            return (
              <button
                key={iso}
                type="button"
                aria-label={iso}
                aria-pressed={isSelected}
                onClick={() => pick(iso)}
                className={`mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-[13px] outline-none transition-colors duration-150 ease-out ${
                  isSelected
                    ? "bg-brand/8 font-medium text-brand"
                    : c.outside
                      ? "text-gray-300 hover:bg-gray-50 hover:text-gray-500"
                      : isToday
                        ? "font-medium text-brand hover:bg-gray-50"
                        : "font-medium text-gray-700 hover:bg-gray-50 focus-visible:bg-gray-50"
                }`}
              >
                {c.d}
              </button>
            );
          })}
        </div>

        {(clearable || value !== todayIso) && (
          <div className="mt-2 flex items-center justify-between pt-1">
            {clearable ? (
              <button
                type="button"
                onClick={() => pick("")}
                disabled={!value}
                className="cursor-pointer text-xs font-medium text-gray-500 transition-colors duration-150 ease-out hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
              >
                {labels.commonClear}
              </button>
            ) : (
              <span />
            )}
            {value !== todayIso && (
              <button
                type="button"
                onClick={() => pick(todayIso)}
                className="cursor-pointer text-xs font-medium text-gray-500 transition-colors duration-150 ease-out hover:text-brand"
              >
                {labels.commonToday}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
