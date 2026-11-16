"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { defaultDashboardLabels, type DashboardLabels } from "../config/labels";

export interface LabelsContextValue {
  labels: DashboardLabels;
  locale: string;
}

const LabelsContext = createContext<LabelsContextValue>({
  labels: defaultDashboardLabels,
  locale: "en",
});

export function LabelsProvider({
  labels,
  locale,
  children,
}: {
  labels: DashboardLabels;
  locale: string;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ labels, locale }), [labels, locale]);
  return <LabelsContext.Provider value={value}>{children}</LabelsContext.Provider>;
}

export function useLabels(): LabelsContextValue {
  return useContext(LabelsContext);
}
