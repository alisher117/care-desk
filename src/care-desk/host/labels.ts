import {
  defaultDashboardLabels,
  defaultWidgetLabels,
  resolveLabels,
  type DashboardLabels,
  type WidgetLabels,
} from "../config/labels";
import kk from "../config/locales/kk.json";
import ru from "../config/locales/ru.json";

interface LocaleFile {
  widget?: Record<string, string>;
  dashboard?: Record<string, string>;
}

// English lives in config/labels.ts and is the source of truth. A locale file
// only overrides what it translates; a missing key, an empty value or a value
// that lost a {placeholder} falls back to English. To add a language, drop a
// JSON file next to these, register it here and list it in config.locales.
// This is also the seam for a CMS: fetch the same shape instead of importing.
const LOCALE_FILES: Record<string, LocaleFile> = { ru, kk };

export async function getWidgetLabels(locale: string): Promise<WidgetLabels> {
  return resolveLabels(defaultWidgetLabels, LOCALE_FILES[locale]?.widget);
}

export async function getDashboardLabels(locale: string): Promise<DashboardLabels> {
  return resolveLabels(defaultDashboardLabels, LOCALE_FILES[locale]?.dashboard);
}
