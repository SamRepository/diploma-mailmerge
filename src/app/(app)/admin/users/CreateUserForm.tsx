"use client";

import { useActionState } from "react";
import { createUser, type ActionState } from "./actions";

const initial: ActionState = {};

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUser, initial);

  return (
    <form action={formAction} className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 font-medium text-slate-900">Add user</h2>

      {state.error && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}
      {state.success && (
        <div className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" placeholder="Full name" required className="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input name="email" type="email" placeholder="Email" required className="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input name="password" type="text" placeholder="Initial password (min 6)" required className="rounded border border-slate-300 px-3 py-2 text-sm" />
        <select name="role" defaultValue="STAFF" className="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
