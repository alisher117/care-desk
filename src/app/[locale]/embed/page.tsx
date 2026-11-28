import type { Metadata } from "next";
import EmbedWidget from "@/app/ui/embed-widget";
import { getWidgetLabels } from "@/care-desk/host/labels";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const labels = await getWidgetLabels(locale);

  return (
    <>
      <style>{"html,body{background:transparent!important;margin:0}"}</style>
      <EmbedWidget labels={labels} />
    </>
  );
}
