import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export default async function TemplatesPage() {
  await requireAdmin();
  const templates = await prisma.template.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { fields: true, students: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Templates</h1>
        <a href="/print/calibration" target="_blank" rel="noopener" className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
          🖨 Calibration grid
        </a>
      </div>
      <p className="text-sm text-slate-500">
        Upload a scan of the blank diploma and drag each field to its exact position. Positions are stored in
        millimetres and drive both the on-screen preview and printing.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((t) => (
          <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900">{t.name}</div>
                <div className="text-sm text-slate-500">
                  {t.degreeType} · {t.pageWidthMm}×{t.pageHeightMm} mm · {t._count.fields} fields · {t._count.students} students
                </div>
              </div>
              <span className={t.backgroundImagePath ? "text-green-600" : "text-amber-600"}>
                {t.backgroundImagePath ? "Background set" : "No background"}
              </span>
            </div>
            <div className="mt-4">
              <Link
                href={`/templates/${t.id}/calibrate`}
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Calibrate fields
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
