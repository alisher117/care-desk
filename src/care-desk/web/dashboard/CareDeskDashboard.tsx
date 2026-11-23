"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { defaultDashboardLabels, type DashboardLabels } from "../../config/labels";
import { LabelsProvider } from "../labels-context";
import { DASHBOARD_PATH } from "../routes";
import type { View } from "../types";
import AccountView from "./AccountView";
import OverviewView from "./OverviewView";
import SettingsView from "./SettingsView";
import Sidebar from './Sidebar';
import TicketDetail from "./TicketDetail";
import TicketsView from "./TicketsView";

export default function CareDeskDashboard({
  operatorName,
  canAdmin,
  initialTicketId,
  initialTab,
  labels = defaultDashboardLabels,
  locale = "en",
  onSignOut,
  settingsExtra,
}: {
  operatorName: string;
  canAdmin: boolean;
  initialTicketId?: string;
  initialTab?: View,
  labels?: DashboardLabels;
  locale?: string;
  onSignOut?: () => void;
  settingsExtra?: React.ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(initialTicketId ?? null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<View>(initialTab ?? 'tickets');

  const pageTitles: Record<View, string> = {
    tickets: labels.ticketsTitle,
    overview: labels.navOverview,
    settings: labels.navSettings,
    account: labels.accountTitle,
  };

  function pushUrl(path: string) {
    const p = window.location.pathname;
    const baseIdx = p.indexOf(DASHBOARD_PATH);
    const prefix = baseIdx >= 0 ? p.slice(0, baseIdx) : "";
    window.history.replaceState(null, "", `${prefix}${DASHBOARD_PATH}${path}`);
  }

  function openTicket(id: string) {
    setOpenId(id);
    pushUrl(`/${id}`);
  }

  function navigate(next: View) {
    setView(next);
    setOpenId(null);
    pushUrl(next === 'tickets' ? '' : `/${next}`);
  }

  function closeTicket() {
    setOpenId(null);
    pushUrl(view === 'tickets' ? '' : `/${view}`);
  }

  function renderView() {
    if (openId) {
      return (
        <TicketDetail
          ticketId={openId}
          canAssign={canAdmin}
          onBack={closeTicket}
        />
      )
    } else if (view === 'overview') {
      return <OverviewView />
    } else if (view === 'settings') {
      return <SettingsView canAdmin={canAdmin} />
    } else if (view === 'account') {
      return <AccountView onOpen={openTicket} />
    } else {
      return <TicketsView onOpen={openTicket} />
    }
  }

  return (
    <LabelsProvider labels={labels} locale={locale}>
      <div className="flex min-h-screen bg-white">
        <Sidebar
          open={sidebarOpen}
          view={view}
          operatorName={operatorName}
          onClose={() => setSidebarOpen(false)}
          onNavigate={navigate}
          onSignOut={onSignOut}
        />
        <main className="min-w-0 flex-1 p-6">
          <div className="mb-4 flex items-center gap-2">
            {!sidebarOpen && (
              <button
                type="button"
                aria-label={labels.navOpenSidebar}
                onClick={() => setSidebarOpen(true)}
                className="cursor-pointer rounded-lg p-2 transition-colors duration-200 hover:bg-gray-100"
              >
                <Menu size={16} />
              </button>
            )}
            {!openId && (
              <h1 className="text-xl font-bold text-gray-900">{pageTitles[view]}</h1>
            )}
          </div>
          {renderView()}
        </main>
      </div>
    </LabelsProvider>
  );
}
