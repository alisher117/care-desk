"use client";

import { useActionState } from "react";
import { setup } from "../actions/auth";

export default function SetupForm({ locale }: { locale: string }) {
  const [state, action, pending] = useActionState(setup, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />

      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          defaultValue={state?.values?.name}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        {state?.errors?.name && (
          <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          autoComplete="email"
          defaultValue={state?.values?.name}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        {state?.errors?.email && (
          <p className="mt-1 text-xs text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand'
        />
        {state?.errors?.password && (
          <p className='mt-1 text-xs text-red-600'>{state.errors.password[0]}</p>
        )}
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create admin account"}
      </button>
    </form>
  );
}
