import { devOperator } from "@/care-desk/host/identity-adapter";
import { getDashboardLabels } from "@/care-desk/host/labels";
import CareDeskDashboard from "@/care-desk/web/dashboard/CareDeskDashboard";
import type { View } from "@/care-desk/web/types";
import { logout } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

const VIEWS: readonly View[] = ["overview", "settings", "account"];

export default async function CareDeskPage({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { locale, slug } = await params;
  const labels = await getDashboardLabels(locale);
  
  const operator = devOperator();

  const first = slug?.[0];
  const tab = first && VIEWS.includes(first as View) ? (first as View) : undefined;
  return (
    <CareDeskDashboard
      operatorName={operator.displayName || labels.commonUserFallback}
      canAdmin={Boolean(operator.moderator)}
      initialTab={tab}
      initialTicketId={tab ? undefined : first}
      labels={labels}
      locale={locale}
      onSignOut={logout.bind(null, locale)}
    />
  );
}
