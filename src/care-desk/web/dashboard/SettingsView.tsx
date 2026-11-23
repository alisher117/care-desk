'use client'
import { careDeskConfig } from "../../config/config"
import { fmt } from "../../config/labels"
import { useLabels } from "../labels-context"
import CategorySettings from "./CategorySettings"
import { CARD, CARD_TITLE } from "./styles"

const CHIP =
  "inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-1.5 text-[13px] font-medium text-gray-700 transition-colors duration-200 ease-out"

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${CARD} p-5`}>
      <p className={`mb-3 ${CARD_TITLE}`}>{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

export default function SettingsView({ canAdmin, extra, }: { canAdmin: boolean; extra?: React.ReactNode }) {
  const { labels } = useLabels();
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-gray-900">{careDeskConfig.name}</h2>
      <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-gray-600">
        {fmt(labels.settingsDescription, { count: careDeskConfig.locales.length })}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <CategorySettings canManage={canAdmin} />

        <Section title={labels.settingsLocalesTitle}>
          <div className="flex flex-wrap gap-2">
            {careDeskConfig.locales.map((l) => (
              <span key={l} className={CHIP}>
                {l.toUpperCase()}
                {l === careDeskConfig.defaultLocale && (
                  <span className="rounded-lg bg-brand/8 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand">
                    {labels.settingsDefaultBadge}
                  </span>
                )}
              </span>
            ))}
          </div>
        </Section>

        <Section title={labels.settingsBrandingTitle}>
          <div className="flex items-center gap-3">
            <span
              className="h-8 w-8 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"
              style={{ backgroundColor: careDeskConfig.branding.primaryColor }}
            />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-500">{labels.settingsPrimaryColor}</span>
              <span className="text-sm font-medium text-gray-900">
                {careDeskConfig.branding.primaryColor}
              </span>
            </div>
          </div>

          <div className="mt-1 flex flex-col">
            <span className="text-xs font-medium text-gray-500">{labels.settingsFontFamily}</span>
            <span className="text-sm font-medium text-gray-900">
              {careDeskConfig.branding.fontFamily}
            </span>
          </div>
        </Section>
      </div>
      {extra}
    </div>
  )
}
