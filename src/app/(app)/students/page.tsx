import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { deleteStudent } from "@/lib/students";
import type { Prisma } from "@prisma/client";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireUser();
  const { q, status } = await searchParams;

  const where: Prisma.StudentWhereInput = {};
  if (q && q.trim()) {
    where.OR = [
      { nameLatin: { contains: q.trim() } },
      { nameArabic: { contains: q.trim() } },
      { serialNumber: { contains: q.trim() } },
      { specialityLatin: { contains: q.trim() } },
    ];
  }
  if (status === "PENDING" || status === "PRINTED") where.printStatus = status;

  const students = await prisma.student.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Students ({students.length})</h1>
        <Link href="/students/new" className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          + Add student
        </Link>
      </div>

      <form className="flex flex-wrap items-center gap-2" method="get">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, serial, speciality…"
          className="w-64 rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={status ?? ""} className="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PRINTED">Printed</option>
        </select>
        <button type="submit" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
          Filter
        </button>
        {(q || status) && (
          <Link href="/students" className="text-sm text-slate-500 hover:text-slate-700">
            Clear
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Speciality</th>
              <th className="px-4 py-2 font-medium">Center</th>
              <th className="px-4 py-2 font-medium">Serial N°</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No students yet. <Link href="/import" className="text-indigo-600 hover:underline">Import</Link> or{" "}
                  <Link href="/students/new" className="text-indigo-600 hover:underline">add one</Link>.
                </td>
              </tr>
            )}
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-900">{s.nameLatin}</div>
                  {s.nameArabic && <div dir="rtl" className="font-arabic text-slate-500">{s.nameArabic}</div>}
                </td>
                <td className="px-4 py-2 text-slate-600">{s.specialityLatin ?? "—"}</td>
                <td className="px-4 py-2 text-slate-600">{s.centerLatin ?? "—"}</td>
                <td className="px-4 py-2 text-slate-600">{s.serialNumber ?? "—"}</td>
                <td className="px-4 py-2">
                  {s.printStatus === "PRINTED" ? (
                    <span className="text-green-600">Printed</span>
                  ) : (
                    <span className="text-amber-600">Pending</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Link href={`/students/${s.id}/diploma`} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100">
                      Diploma
                    </Link>
                    <Link href={`/students/${s.id}/edit`} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100">
                      Edit
                    </Link>
                    <form action={deleteStudent}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
