import { notFound } from "next/navigation";
import SetupForm from "@/app/ui/signup-form";
import { careDeskConfig } from "@/care-desk/config/config";
import { hasUsers } from "@/care-desk/host/users";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (await hasUsers()) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Set up {careDeskConfig.name}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Create the first account. It becomes the admin.
        </p>
      </div>
      <SetupForm locale={locale} />
    </main>
  );
}
