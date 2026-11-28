import { careDeskConfig } from "@/care-desk/config/config";
import { getWidgetLabels } from "@/care-desk/host/labels";
import CareDeskWidget from "@/care-desk/web/widget/CareDeskWidget";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const labels = await getWidgetLabels(locale);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold text-gray-900">{careDeskConfig.name}</h1>
      <p className="text-sm leading-relaxed text-gray-600">
        Use the help button in the corner to submit a request.
      </p>
      <CareDeskWidget labels={labels} />
    </main>
  );
}