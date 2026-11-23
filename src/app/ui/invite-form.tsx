'use client'

import { createInviteAction } from "@/app/actions/invites";
import { FIELD, PRIMARY_BUTTON } from "@/care-desk/web/dashboard/styles";
import { useActionState, useState } from "react";

export default function InviteForm({ locale }: { locale: string }) {
  const [state, action, pending] = useActionState(createInviteAction.bind(null, locale), undefined)
  const [copied, setCopied] = useState(false)

  async function copy(link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <form action={action} className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <input
            name="email"
            type="email"
            required
            placeholder="name@example.com"
            aria-label="Email to invite"
            defaultValue={state?.link ? "" : state?.email}
            className={FIELD}
          />
        </div>
        <div className="w-36 shrink-0">
          <select name="role" aria-label="Role" defaultValue="operator" className={FIELD}>
            <option value="operator">Operator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" disabled={pending} className={`${PRIMARY_BUTTON} shrink-0 bg-brand`}>
          {pending ? "Creating…" : "Create invite"}
        </button>
      </form>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      {state?.link && (
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[13px] font-medium text-gray-700">
            Invite link for {state.email}. Copy it now: it is shown only once.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input readOnly value={state.link} aria-label="Invite link" className={`${FIELD} flex-1 font-mono text-xs`} />
            <button type="button" onClick={() => copy(state.link!)} className={`${PRIMARY_BUTTON} bg-brand`}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
