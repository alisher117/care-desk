import InviteSignupForm from "@/app/ui/invite-signup-form";
import { careDeskConfig } from "@/care-desk/config/config";
import { findValidInvite } from "@/care-desk/host/invites";

export const dynamic = 'force-dynamic';

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const invite = await findValidInvite(token);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      {invite ? (
        <>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Join {careDeskConfig.name}</h1>
            <p className="mt-1 text-sm text-gray-600">You were invited as {invite.role}.</p>
          </div>
          <InviteSignupForm token={token} locale={locale} email={invite.email} />
        </>
      ) : (
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invite not valid</h1>
          <p className="mt-1 text-sm text-gray-600">
            This link was already used, was revoked, or has expired. Ask an admin for a new one.
          </p>
        </div>
      )}
    </main>
  )
}
