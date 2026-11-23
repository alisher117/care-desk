import { getCurrentUser, logout } from "@/app/actions/auth";
import TeamCard from "@/app/ui/team-card";
import { getDashboardLabels } from "@/care-desk/host/labels";
import CareDeskDashboard from "@/care-desk/web/dashboard/CareDeskDashboard";
import type { View } from "@/care-desk/web/types";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const VIEWS: readonly View[] = ["overview", "settings", "account"];

export default async function CareDeskPage({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { locale, slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const labels = await getDashboardLabels(locale);
  const first = slug?.[0];
  const tab =
    first && VIEWS.includes(first as View) ? (first as View) : undefined;
  return (
    <CareDeskDashboard
      operatorName={user.name || labels.commonUserFallback}
      canAdmin={user.role === "admin"}
      initialTab={tab}
      initialTicketId={tab ? undefined : first}
      labels={labels}
      locale={locale}
      onSignOut={logout.bind(null, locale)}
      settingsExtra={user.role === "admin" ? <TeamCard locale={locale} /> : undefined}
    />
  );
}
