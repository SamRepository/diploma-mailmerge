"use client";

import { useActionState } from "react";
import { resetPassword, type ActionState } from "./actions";

const initial: ActionState = {};

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initial);

  return (
    <div>
      <form action={formAction} className="flex items-center gap-1">
        <input type="hidden" name="id" value={userId} />
        <input
          name="password"
          type="text"
          placeholder="new password"
          className="w-28 rounded border border-slate-300 px-2 py-1 text-xs"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          {pending ? "…" : "Reset"}
        </button>
      </form>
      {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="mt-1 text-xs text-green-600">✓ {state.success}</p>}
    </div>
  );
}
