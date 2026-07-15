import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  await requireUser();

  const [total, pending, printed, templates] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { printStatus: "PENDING" } }),
    prisma.student.count({ where: { printStatus: "PRINTED" } }),
    prisma.template.count({ where: { active: true } }),
  ]);

  const stats = [
    { label: "Students", value: total, href: "/students" },
    { label: "Pending print", value: pending, href: "/students?status=PENDING" },
    { label: "Printed", value: printed, href: "/students?status=PRINTED" },
    { label: "Active templates", value: templates, href: "/templates" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="text-2xl font-semibold text-slate-900">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <QuickAction href="/students/new" title="Add a student" desc="Enter a new PhD graduate manually." />
        <QuickAction href="/import" title="Import from Excel" desc="Bulk-load students from an .xls/.xlsx file." />
        <QuickAction href="/print/batch" title="Bulk print" desc="Select students and print or export PDFs." />
      </div>
    </div>
  );
}

function QuickAction({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm">
      <div className="font-medium text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{desc}</div>
    </Link>
  );
}
