"use client";

import { LifeBuoy, Loader2, LogIn, Send, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { careDeskConfig } from "../../config/config";
import { defaultWidgetLabels, type WidgetLabels } from "../../config/labels";
import { ApiError, widgetApi } from "../api";
import type { CategoryDto } from "../types";
import {
  CATEGORY_REQUIRED_MESSAGE,
  CATEGORY_UNAVAILABLE_MESSAGE,
  TICKET_DESCRIPTION_MAX,
  ticketFormSchema,
  validateCategory,
} from "../validation";
import { CARE_DESK_OPEN_EVENT } from "./open";

type Phase = "closed" | "open" | "closing";
type View = "form" | "success" | "login";
type FieldErrors = { category?: string; subject?: string; description?: string };
type TextField = "subject" | "description";

const CLOSE_MS = 200;
const NUMBER_PLACEHOLDER = "{number}";

const ISSUE_LABEL_KEYS: Record<TextField, Partial<Record<string, keyof WidgetLabels>>> = {
  subject: { too_small: "widgetErrSubjectRequired", too_big: "widgetErrSubjectTooLong" },
  description: {
    too_small: "widgetErrDescriptionRequired",
    too_big: "widgetErrDescriptionTooLong",
  },
};

function issueLabel(
  labels: WidgetLabels,
  field: TextField,
  issue: { code: string; message: string },
): string {
  const key = ISSUE_LABEL_KEYS[field][issue.code];
  return key ? labels[key] : issue.message;
}

function sharedMessageLabel(labels: WidgetLabels, message: string | undefined): string | undefined {
  if (message === undefined) return undefined;
  if (message === CATEGORY_REQUIRED_MESSAGE) return labels.widgetErrCategoryRequired;
  if (message === CATEGORY_UNAVAILABLE_MESSAGE) return labels.widgetErrCategoryUnavailable;
  return message;
}

export default function CareDeskWidget({
  labels = defaultWidgetLabels,
}: {
  labels?: WidgetLabels;
}) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [view, setView] = useState<View>("form");
  const [pulsed, setPulsed] = useState(false);
  const [categories, setCategories] = useState<CategoryDto[] | null>(null);
  const [categoriesStatus, setCategoriesStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState("");
  const [sending, setSending] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categoriesRequest = useRef(0);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (phase === "open") {
      closeButtonRef.current?.focus();
      return;
    }
    if (!restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    (target?.isConnected ? target : launcherRef.current)?.focus();
  }, [phase]);

  function refreshCategories() {
    const request = ++categoriesRequest.current;
    setCategoriesStatus("loading");
    widgetApi
      .categories()
      .then((list) => {
        if (request !== categoriesRequest.current) return;
        setCategories(list);
        setCategory((prev) => (list.some((c) => c.name === prev) ? prev : ""));
        setCategoriesStatus("ready");
      })
      .catch((err: unknown) => {
        if (request !== categoriesRequest.current) return;
        if (err instanceof ApiError && err.status === 401) setView("login");
        else setCategoriesStatus("failed");
      });
  }

  function openPanel() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (phase !== "open") {
      const active = document.activeElement;
      returnFocusRef.current =
        active instanceof HTMLElement &&
        active !== document.body &&
        !panelRef.current?.contains(active)
          ? active
          : null;
    }
    setPulsed(true);
    setPhase("open");
    refreshCategories();
  }

  useEffect(() => {
    window.addEventListener(CARE_DESK_OPEN_EVENT, openPanel);
    return () => window.removeEventListener(CARE_DESK_OPEN_EVENT, openPanel);
  });

  function closePanel() {
    if (phase !== "open") return;
    const active = document.activeElement;
    restoreFocusRef.current =
      active === null || active === document.body || (panelRef.current?.contains(active) ?? false);
    const finish = () => {
      setPhase("closed");
      if (view === "success") setView("form");
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    setPhase("closing");
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      finish();
    }, CLOSE_MS);
  }

  useEffect(() => {
    if (phase !== "open") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  function reset() {
    setCategory("");
    setSubject("");
    setDescription("");
    setErrors({});
    setFormError(null);
  }

  function pick(name: string) {
    setCategory(name);
    setErrors((prev) => ({ ...prev, category: undefined }));
  }

  async function submit() {
    if (sending || categoriesStatus !== "ready") return;
    setFormError(null);

    const parsed = ticketFormSchema.safeParse({ category: category || undefined, subject, description });
    const fieldErrors: FieldErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "subject") fieldErrors.subject = issueLabel(labels, "subject", issue);
        if (key === "description") {
          fieldErrors.description = issueLabel(labels, "description", issue);
        }
      }
    }
    if (categories) {
      const categoryError = validateCategory(category, categories.map((c) => c.name));
      if (categoryError) fieldErrors.category = sharedMessageLabel(labels, categoryError);
    }
    if (!parsed.success || Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setSending(true);
    try {
      const ticket = await widgetApi.submit(parsed.data);
      setTicketNumber(`#${String(ticket.number).padStart(3, "0")}`);
      reset();
      setView("success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setView("login");
      } else if (err instanceof ApiError && err.status === 400 && err.issues) {
        setErrors({
          category: sharedMessageLabel(labels, err.issues.category?.[0]),
          subject: sharedMessageLabel(labels, err.issues.subject?.[0]),
          description: sharedMessageLabel(labels, err.issues.description?.[0]),
        });
        if (err.issues.category) {
          setCategory("");
          refreshCategories();
        }
      } else {
        console.error("[care-desk] ticket submit failed", err);
        setFormError(labels.widgetErrGeneric);
      }
    } finally {
      setSending(false);
    }
  }

  const headings: Record<View, { title: string; hint: string }> = {
    form: { title: labels.widgetFormTitle, hint: labels.widgetFormHint },
    success: { title: labels.widgetSuccessTitle, hint: labels.widgetSuccessHint },
    login: { title: labels.widgetLoginTitle, hint: labels.widgetLoginHint },
  };
  const heading = headings[view];
  const showCategories = categories === null ? categoriesStatus === "loading" : categories.length > 0;
  const numberAt = labels.widgetSuccessBody.indexOf(NUMBER_PLACEHOLDER);
  const successBefore =
    numberAt >= 0 ? labels.widgetSuccessBody.slice(0, numberAt) : labels.widgetSuccessBody;
  const successAfter =
    numberAt >= 0 ? labels.widgetSuccessBody.slice(numberAt + NUMBER_PLACEHOLDER.length) : "";

  return (
    <div style={{ "--brand": careDeskConfig.branding.primaryColor } as CSSProperties}>
      {phase !== "open" && (
        <button
          ref={launcherRef}
          type="button"
          onClick={openPanel}
          aria-label={labels.widgetOpen}
          className="group fixed bottom-5 right-5 z-50 flex h-16 items-center rounded-full bg-(--brand) px-4.5 text-white shadow-xl transition-all duration-300 ease-out animate-widget-pop hover:-translate-y-0.5 hover:shadow-2xl hover:brightness-110 active:translate-y-0 active:scale-95 sm:px-6"
        >
          {!pulsed && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-(--brand) opacity-0 animate-widget-ring"
            />
          )}
          <LifeBuoy
            size={28}
            className="shrink-0 transition-transform duration-500 ease-out group-hover:rotate-45"
          />
          <span className="hidden whitespace-nowrap text-base font-semibold sm:ml-2.5 sm:inline">
            {labels.widgetOpen}
          </span>
        </button>
      )}

      {phase !== "closed" && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={careDeskConfig.name}
          tabIndex={-1}
          className={`fixed bottom-5 right-5 z-50 flex max-h-[calc(100dvh-2.5rem)] w-105 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_24px_48px_-16px_rgba(0,0,0,0.28)] outline-none ${phase === "closing" ? "animate-widget-out" : "animate-widget-in"}`}
        >
          <div className="relative shrink-0 overflow-hidden bg-[linear-gradient(135deg,var(--brand),color-mix(in_srgb,var(--brand)_72%,#0a0a0a))] px-5 py-4 text-white shorter:py-3">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full bg-white/10 animate-float"
            />
            <span
              aria-hidden="true"
              style={{ animationDelay: "1.2s" }}
              className="pointer-events-none absolute -bottom-10 right-16 h-20 w-20 rounded-full bg-white/5 animate-float"
            />
            <div className="relative flex items-start justify-between gap-3">
              <div key={view} className="animate-widget-view">
                <p className="text-[11px] font-medium uppercase tracking-wide text-white/70 shorter:hidden">
                  {careDeskConfig.name}
                </p>
                <h3 className="mt-0.5 text-lg font-semibold">{heading.title}</h3>
                <p className="mt-0.5 text-xs text-white/80">{heading.hint}</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closePanel}
                aria-label={labels.widgetClose}
                className="-mr-1.5 -mt-1 shrink-0 rounded-full p-1.5 text-white/80 transition-all duration-200 ease-out hover:rotate-90 hover:bg-white/15 hover:text-white active:scale-90"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            className={`min-h-0 overflow-y-auto overscroll-contain px-5 pt-5 shorter:px-4 shorter:pt-4 ${view === "form" ? "pb-4 shorter:pb-3" : "pb-5 shorter:pb-4"}`}
          >
            {view === "login" && (
              <div className="flex flex-col items-center gap-3 py-2 text-center animate-widget-view">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 animate-widget-pop">
                  <LogIn size={24} />
                </span>
                <p className="text-sm text-gray-700">{labels.widgetLoginBody}</p>
              </div>
            )}

            {view === "success" && (
              <div className="flex flex-col items-center gap-3 py-2 text-center animate-widget-view">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-(--brand)/10 text-(--brand) animate-widget-pop">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      pathLength={24}
                      strokeDasharray={24}
                      className="animate-widget-check"
                    />
                  </svg>
                </span>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">
                    {labels.widgetSuccessHeading}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {successBefore}
                    <span
                      style={{ animationDelay: "300ms" }}
                      className="inline-block rounded-lg bg-gray-100 px-1.5 py-0.5 font-semibold tabular-nums text-gray-900 animate-widget-pop"
                    >
                      {ticketNumber}
                    </span>
                    {successAfter}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setView("form")}
                  className="text-sm font-semibold text-(--brand) underline-offset-4 transition-all duration-200 ease-out hover:underline"
                >
                  {labels.widgetSubmitAnother}
                </button>
              </div>
            )}

            {view === "form" && (
              <div className="flex flex-col gap-4 animate-widget-view shorter:gap-3">
                {categoriesStatus === "failed" && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-red-50 px-3 py-2 animate-widget-view">
                    <p className="text-xs font-medium text-red-600">{labels.widgetErrCategoriesLoad}</p>
                    <button
                      type="button"
                      onClick={refreshCategories}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-red-700 underline-offset-4 transition-all duration-200 ease-out hover:bg-red-100 hover:underline active:scale-95"
                    >
                      {labels.widgetRetry}
                    </button>
                  </div>
                )}

                {(showCategories || errors.category) && (
                  <div>
                    {showCategories && (
                      <p className="mb-1.5 text-xs font-medium text-gray-500">
                        {labels.widgetCategoryLabel}
                      </p>
                    )}
                    {!showCategories ? null : categories === null ? (
                      <div className="flex gap-2">
                        <span className="h-9 w-16 rounded-xl bg-gray-100 animate-pulse" />
                        <span
                          style={{ animationDelay: "150ms" }}
                          className="h-9 w-20 rounded-xl bg-gray-100 animate-pulse"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {categories.map((c, i) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => pick(c.name)}
                            aria-pressed={category === c.name}
                            style={{ animationDelay: `${i * 50}ms` }}
                            className={`rounded-xl border px-3.5 py-2 text-sm font-medium animate-widget-view transition-all duration-200 ease-out active:scale-95 ${category === c.name ? "scale-[1.04] border-(--brand) bg-(--brand) text-white shadow-md" : errors.category ? "border-red-300 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-red-400" : "border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm"}`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {errors.category && (
                      <p className="mt-1.5 text-xs font-medium text-red-600 animate-widget-view">
                        {errors.category}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="care-desk-subject"
                    className="mb-1 block text-xs font-medium text-gray-500"
                  >
                    {labels.widgetSubjectLabel}
                  </label>
                  <input
                    id="care-desk-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void submit();
                      }
                    }}
                    placeholder={labels.widgetSubjectPlaceholder}
                    className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200 ease-out placeholder:text-gray-400 focus:ring-[3px] ${errors.subject ? "border-red-300 focus:border-red-400 focus:ring-red-500/15" : "border-gray-200 hover:border-gray-300 focus:border-(--brand) focus:ring-(--brand)/15"}`}
                  />
                  {errors.subject && (
                    <p className="mt-1.5 text-xs font-medium text-red-600 animate-widget-view">
                      {errors.subject}
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor="care-desk-description"
                      className="text-xs font-medium text-gray-500"
                    >
                      {labels.widgetDescriptionLabel}
                    </label>
                    <span
                      className={`text-[11px] font-medium tabular-nums transition-colors duration-200 ease-out ${description.length > TICKET_DESCRIPTION_MAX ? "text-red-600" : description.length > TICKET_DESCRIPTION_MAX * 0.9 ? "text-amber-600" : "text-gray-400"}`}
                    >
                      {description.length}/{TICKET_DESCRIPTION_MAX}
                    </span>
                  </div>
                  <textarea
                    id="care-desk-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={labels.widgetDescriptionPlaceholder}
                    rows={5}
                    className={`w-full resize-none shorter:h-21 rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200 ease-out placeholder:text-gray-400 focus:ring-[3px] ${errors.description ? "border-red-300 focus:border-red-400 focus:ring-red-500/15" : "border-gray-200 hover:border-gray-300 focus:border-(--brand) focus:ring-(--brand)/15"}`}
                  />
                  {errors.description && (
                    <p className="mt-1.5 text-xs font-medium text-red-600 animate-widget-view">
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {view === "form" && (
            <div className="flex shrink-0 flex-col gap-4 px-5 pb-5 animate-widget-view shorter:gap-3 shorter:px-4 shorter:pb-4">
              {formError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 animate-widget-view">
                  {formError}
                </p>
              )}

              <button
                type="button"
                onClick={() => void submit()}
                disabled={sending || categoriesStatus !== "ready"}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-(--brand) px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:brightness-110 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md disabled:hover:brightness-100"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send
                    size={16}
                    className="transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                )}
                {sending ? labels.widgetSending : labels.widgetSubmit}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
