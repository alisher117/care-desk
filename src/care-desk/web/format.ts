const LOCALE_TAGS: Record<string, string> = {
  en: "en-GB",
  ru: "ru-RU",
  kk: "kk-KZ",
};

export function localeTag(locale: string): string {
  return LOCALE_TAGS[locale] ?? locale;
}

export function timeShort(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(localeTag(locale), { hour: "2-digit", minute: "2-digit" });
}

export function dateTimeShort(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleString(localeTag(locale), {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function weekdaysShort(locale: string): string[] {
  const f = new Intl.DateTimeFormat(localeTag(locale), { weekday: "short" });
  return Array.from({ length: 7 }, (_, i) => f.format(new Date(2024, 0, 1 + i)).slice(0, 2));
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function durationHuman(seconds: number | null, locale: string): string {
  if (seconds === null) return "—";
  const unit = (value: number, u: "second" | "minute" | "hour") =>
    new Intl.NumberFormat(localeTag(locale), {
      style: "unit",
      unit: u,
      unitDisplay: "narrow",
    }).format(value);
  if (seconds < 60) return unit(seconds, "second");
  const m = Math.round(seconds / 60);
  if (m < 60) return unit(m, "minute");
  const h = Math.floor(m / 60);
  return `${unit(h, "hour")} ${unit(m % 60, "minute")}`;
}
