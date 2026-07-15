"use client";

import Link from "next/link";
import { useActionState } from "react";
import { STUDENT_FIELDS, STUDENT_GROUPS, type StudentFieldKey } from "@/lib/studentFields";
import type { StudentActionState } from "@/lib/students";

type Values = Partial<Record<StudentFieldKey, string | null>>;

export function StudentForm({
  action,
  initial = {},
  submitLabel,
}: {
  action: (prev: StudentActionState, formData: FormData) => Promise<StudentActionState>;
  initial?: Values;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}

      {STUDENT_GROUPS.map((group) => (
        <fieldset key={group} className="rounded-lg border border-slate-200 bg-white p-4">
          <legend className="px-1 text-sm font-semibold text-slate-700">{group}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {STUDENT_FIELDS.filter((f) => f.group === group).map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1 block text-sm text-slate-600">
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </span>
                <input
                  name={f.key}
                  defaultValue={initial[f.key] ?? ""}
                  required={f.required}
                  dir={f.arabic ? "rtl" : "ltr"}
                  className={`w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${
                    f.arabic ? "font-arabic text-right text-base" : ""
                  }`}
                />
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href="/students" className="text-sm text-slate-500 hover:text-slate-700">
          Cancel
        </Link>
      </div>
    </form>
  );
}
