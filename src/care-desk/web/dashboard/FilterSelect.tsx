"use client"

import { useEffect, useRef, useState } from "react";

export default function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  className,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; color?: string; disabled?: boolean }[];
  placeholder?: string;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const items =
    placeholder === undefined ? options : [{ value: "", label: placeholder }, ...options];
  const selectedIndex = Math.max(items.findIndex((o) => o.value === value), 0);
  const selected = items[selectedIndex] ?? { value: "", label: "" };

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

  useEffect(() => {
    if (open) optionRefs.current[selectedIndex]?.focus();
  }, [open, selectedIndex]);

  function select(next: string) {
    setOpen(false);
    triggerRef.current?.focus();
    if (next !== value) onChange(next);
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const idx = optionRefs.current.findIndex((el) => el === document.activeElement);
      const delta = e.key === "ArrowDown" ? 1 : -1;
      optionRefs.current[(idx + delta + items.length) % items.length]?.focus();
    } else if (e.key === "Escape") {
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={`relative inline-block ${className ?? ""}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={`inline-flex w-full cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2 text-sm outline-none transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${
          open
            ? "border-brand bg-brand/8 text-brand"
            : "border-gray-100 bg-white text-gray-700 hover:border-gray-300 active:bg-brand/8 active:text-brand focus-visible:border-brand focus-visible:bg-brand/8 focus-visible:text-brand"
        }`}
      >
        {selected.color && (
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200 ease-out"
            style={{ backgroundColor: selected.color }}
          />
        )}
        {selected.label}
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          className={`ml-auto h-3.5 w-3.5 shrink-0 transition-all duration-200 ease-out ${open ? "rotate-180 text-brand" : "text-gray-400"}`}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        role="listbox"
        aria-label={ariaLabel}
        inert={!open}
        onKeyDown={onListKeyDown}
        className={`absolute left-0 top-full z-50 mt-2 min-w-full origin-top rounded-2xl border border-gray-100 bg-white p-1 shadow-lg transition-all duration-200 ease-out ${
          open
            ? "visible translate-y-0 scale-100 opacity-100"
            : "invisible -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {items.map((o, i) => (
          <button
            key={o.value}
            ref={(el) => {
              optionRefs.current[i] = el;
            }}
            type="button"
            role="option"
            aria-selected={o.value === value}
            disabled={o.disabled}
            onClick={() => select(o.value)}
            style={
              o.value === value && o.color
                ? { color: o.color, backgroundColor: `${o.color}14` }
                : undefined
            }
            className={`flex w-full cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-left text-sm outline-none transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60 ${
              o.value === value
                ? o.color
                  ? "font-medium"
                  : "bg-brand/8 font-medium text-brand"
                : "text-gray-700 hover:bg-gray-50 focus-visible:bg-gray-50"
            }`}
          >
            {o.color && (
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: o.color }}
              />
            )}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
