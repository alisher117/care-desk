'use client'

import { useActionState } from "react";
import { signupWithInvite } from "../actions/auth";

export default function InviteSignupForm({
  token,
  locale,
  email,
}: {
  token: string;
  locale: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(
    signupWithInvite.bind(null, token, locale),
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
        <input id="email" value={email} readOnly disabled autoComplete="username" className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand bg-gray-100 text-gray-500' />
      </div>

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">Name</label>
        <input id="name" name="name" autoComplete="name" defaultValue={state?.values?.name} className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand' />
        {state?.errors?.name && <p className='mt-1 text-xs text-red-600'>{state.errors.name[0]}</p>}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand' />
        {state?.errors?.password && (
          <div className='mt-1 text-xs text-red-600'>
            <p>Password must:</p>
            <ul>
              {state.errors.password.map((error) => (
                <li key={error}>- {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  )
}
