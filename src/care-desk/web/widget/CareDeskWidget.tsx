"use client";

import { LifeBuoy, Loader2, Send, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { careDeskConfig } from "../../config/config";
import { defaultWidgetLabels, type WidgetLabels } from "../../config/labels";
import { ApiError, widgetApi } from "../api";
import type { WidgetCategoryDto } from "../types";
import {
  CATEGORY_REQUIRED_MESSAGE,
  CATEGORY_UNAVAILABLE_MESSAGE,
  TICKET_DESCRIPTION_MAX,
  publicTicketFormSchema,
  validateCategory,
} from "../validation";
import { CARE_DESK_OPEN_EVENT } from "./open";

type Phase = "closed" | "open" | "closing";
type View = "form" | "success";
type FieldErrors = {
  name?: string;
  email?: string;
  phone?: string;
  category?: string;
  subject?: string;
  description?: string;
};
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

const FIELD_BASE =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200 ease-out placeholder:text-gray-400 focus:ring-[3px]";
const FIELD_OK = "border-gray-200 hover:border-gray-300 focus:border-(--brand) focus:ring-(--brand)/15";
const FIELD_BAD = "border-red-300 focus:border-red-400 focus:ring-red-500/15";
const fieldClass = (error: string | undefined) => `${FIELD_BASE} ${error ? FIELD_BAD : FIELD_OK}`;

export default function CareDeskWidget({
  labels = defaultWidgetLabels,
  embedded = false,
  onOpenChange,
}: {
  labels?: WidgetLabels;
  /**
   * The widget is alone inside an iframe: it fills the frame instead of
   * floating in a corner, and the page that owns the frame positions it.
   */
  embedded?: boolean;
  /** Called when the panel opens and when it has finished closing. */
  onOpenChange?: (open: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [view, setView] = useState<View>("form");
  const [pulsed, setPulsed] = useState(false);
  const [categories, setCategories] = useState<WidgetCategoryDto[] | null>(null);
  const [categoriesStatus, setCategoriesStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [trap, setTrap] = useState("");
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
      closeButtonRef.current?.focus({ preventScroll: true });
      return;
    }
    if (!restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    (target?.isConnected ? target : launcherRef.current)?.focus();
  }, [phase]);

  // The frame around an embedded widget stays large until the closing
  // animation is over, so "closing" still counts as open.
  const isOpen = phase !== "closed";
  const openChangeRef = useRef(onOpenChange);
  useEffect(() => {
    openChangeRef.current = onOpenChange;
  });
  useEffect(() => {
    openChangeRef.current?.(isOpen);
  }, [isOpen]);

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
        console.error("[care-desk] categories failed to load", err);
        setCategoriesStatus("failed");
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

  // After a successful submit the request fields are cleared, but name, email
  // and phone stay, so a second request does not need them typed again.
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

    const parsed = publicTicketFormSchema.safeParse({
      name,
      email,
      phone: phone || undefined,
      category: category || undefined,
      subject,
      description,
    });
    const fieldErrors: FieldErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "name") fieldErrors.name = labels.widgetErrNameRequired;
        if (key === "email") fieldErrors.email = labels.widgetErrEmailInvalid;
        if (key === "phone") fieldErrors.phone = labels.widgetErrPhoneTooLong;
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
      const ticket = await widgetApi.submit({ ...parsed.data, contact_fax: trap });
      setTicketNumber(`#${String(ticket.number).padStart(3, "0")}`);
      reset();
      setView("success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setFormError(labels.widgetErrRateLimited);
      } else if (err instanceof ApiError && err.status === 400 && err.issues) {
        setErrors({
          name: err.issues.name ? labels.widgetErrNameRequired : undefined,
          email: err.issues.email ? labels.widgetErrEmailInvalid : undefined,
          phone: err.issues.phone ? labels.widgetErrPhoneTooLong : undefined,
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
          className={
            embedded
              ? "group flex h-dvh w-full items-center justify-center rounded-full bg-(--brand) text-white transition-all duration-300 ease-out hover:brightness-110 active:scale-95"
              : "group fixed bottom-5 right-5 z-50 flex h-16 items-center rounded-full bg-(--brand) px-4.5 text-white shadow-xl transition-all duration-300 ease-out animate-widget-pop hover:-translate-y-0.5 hover:shadow-2xl hover:brightness-110 active:translate-y-0 active:scale-95 sm:px-6"
          }
        >
          {!pulsed && !embedded && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-(--brand) opacity-0 animate-widget-ring"
            />
          )}
          <LifeBuoy
            size={28}
            className="shrink-0 transition-transform duration-500 ease-out group-hover:rotate-45"
          />
          {!embedded && (
            <span className="hidden whitespace-nowrap text-base font-semibold sm:ml-2.5 sm:inline">
              {labels.widgetOpen}
            </span>
          )}
        </button>
      )}

      {phase !== "closed" && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={careDeskConfig.name}
          tabIndex={-1}
          className={`${
            embedded
              ? "flex h-dvh w-full flex-col overflow-hidden bg-white outline-none"
              : "fixed bottom-5 right-5 z-50 flex max-h-[calc(100dvh-2.5rem)] w-105 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_24px_48px_-16px_rgba(0,0,0,0.28)] outline-none"
          } ${phase === "closing" ? "animate-widget-out" : "animate-widget-in"}`}
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
            className={`min-h-0 overflow-y-auto overscroll-contain px-5 pt-5 shorter:px-4 shorter:pt-4 ${embedded ? "flex-1" : ""} ${view === "form" ? "pb-4 shorter:pb-3" : "pb-5 shorter:pb-4"}`}
          >
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
                <div>
                  <label htmlFor="care-desk-name" className="mb-1 block text-xs font-medium text-gray-500">
                    {labels.widgetNameLabel}
                  </label>
                  <input
                    id="care-desk-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder={labels.widgetNamePlaceholder}
                    className={fieldClass(errors.name)}
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs font-medium text-red-600 animate-widget-view">{errors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="care-desk-email" className="mb-1 block text-xs font-medium text-gray-500">
                      {labels.widgetEmailLabel}
                    </label>
                    <input
                      id="care-desk-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder={labels.widgetEmailPlaceholder}
                      className={fieldClass(errors.email)}
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-xs font-medium text-red-600 animate-widget-view">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="care-desk-phone" className="mb-1 block text-xs font-medium text-gray-500">
                      {labels.widgetPhoneLabel}
                    </label>
                    <input
                      id="care-desk-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      className={fieldClass(errors.phone)}
                    />
                    {errors.phone && (
                      <p className="mt-1.5 text-xs font-medium text-red-600 animate-widget-view">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Honeypot: off-screen and skipped by keyboard and screen readers.
                    People never fill it in; bots that fill every field do. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="care-desk-contact-fax">Fax</label>
                  <input
                    id="care-desk-contact-fax"
                    name="contact_fax"
                    tabIndex={-1}
                    autoComplete="off"
                    value={trap}
                    onChange={(e) => setTrap(e.target.value)}
                  />
                </div>

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
                            key={c.name}
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
                    className={fieldClass(errors.subject)}
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
                    rows={4}
                    className={`resize-none shorter:h-21 ${fieldClass(errors.description)}`}
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