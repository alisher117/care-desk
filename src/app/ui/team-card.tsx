import { revokeInviteAction } from "@/app/actions/invites";
import InviteForm from "@/app/ui/invite-form";
import { listPendingInvites } from "@/care-desk/host/invites";
import { listUsers } from "@/care-desk/host/users";
import RemoveUserButton from "./remove-user-button";
import {
  CARD,
  CARD_TITLE,
  TABLE_HEAD,
  TABLE_ROW,
  TEXT_LINK,
} from "@/care-desk/web/dashboard/styles";

export default async function TeamCard({
  locale,
  currentUserId,
}: {
  locale: string;
  currentUserId: string;
}) {
  const [users, invites] = await Promise.all([
    listUsers(),
    listPendingInvites(),
  ]);

  return (
    <div className={`${CARD} mt-4 max-w-3xl p-5`}>
      <p className={`mb-3 ${CARD_TITLE}`}>Team</p>

      <table className="w-full">
        <thead className={TABLE_HEAD}>
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className={TABLE_ROW}>
              <td className="px-3 py-2">
                {u.name}
                {u.id === currentUserId && (
                  <span className="ml-2 text-gray-400">(you)</span>
                )}
              </td>
              <td className="px-3 py-2 text-gray-600">{u.email}</td>
              <td className="px-3 py-2 capitalize text-gray-600">{u.role}</td>
              <td className="px-3 py-2 text-right">
                {u.id !== currentUserId && (
                  <RemoveUserButton id={u.id} name={u.name} />
                )}
              </td>
            </tr>
          ))}
          {invites.map((i) => (
            <tr key={i.id} className={TABLE_ROW}>
              <td className="px-3 py-2 text-gray-400">Invited</td>
              <td className="px-3 py-2 text-gray-600">{i.email}</td>
              <td className="px-3 py-2 capitalize text-gray-600">{i.role}</td>
              <td className="px-3 py-2 text-right">
                <form action={revokeInviteAction.bind(null, i.id)}>
                  <button
                    type="submit"
                    className={`${TEXT_LINK} cursor-pointer`}
                  >
                    Revoke
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className={`mb-2 mt-5 ${CARD_TITLE}`}>Invite someone</p>
      <InviteForm locale={locale} />
    </div>
  );
}
