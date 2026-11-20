import { redirect } from "next/navigation";
import LoginForm from "@/app/ui/login-form";
import { careDeskConfig } from "@/care-desk/config/config";
import { getSession } from "@/app/lib/session";
import { getUserById, hasUsers } from "@/care-desk/host/users";
import { DASHBOARD_PATH } from "@/care-desk/web/routes";

export const dynamic = 'force-dynamic';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!(await hasUsers())) redirect(`/${locale}/setup`);

  const session = await getSession();
  if (session && (await getUserById(session.userId))) redirect(`/${locale}${DASHBOARD_PATH}`);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold text-gray-900">Sign in to {careDeskConfig.name}</h1>
      <LoginForm locale={locale} />
    </main>
  );
}