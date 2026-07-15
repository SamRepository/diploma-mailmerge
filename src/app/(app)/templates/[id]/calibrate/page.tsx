import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { uploadBackground } from "@/lib/templates";
import { Calibrator, type CalibratorField } from "./Calibrator";

export default async function CalibratePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const template = await prisma.template.findUnique({
    where: { id },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!template) notFound();

  const sample = await prisma.student.findFirst({ where: { templateId: id }, orderBy: { createdAt: "asc" } });

  const fields: CalibratorField[] = template.fields.map((f) => ({
    id: f.id,
    key: f.key,
    label: f.label,
    source: f.source,
    lang: f.lang,
    xMm: f.xMm,
    yMm: f.yMm,
    widthMm: f.widthMm,
    fontSize: f.fontSize,
    fontFamily: f.fontFamily,
    align: f.align as "left" | "center" | "right",
    direction: f.direction as "ltr" | "rtl",
    printable: f.printable,
    fixedValue: f.fixedValue,
    sampleValue: sample
      ? f.fixedValue ?? (f.source ? String((sample as unknown as Record<string, unknown>)[f.source] ?? "") : "")
      : f.fixedValue ?? "",
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Calibrate — {template.name}</h1>
        <Link href="/templates" className="text-sm text-slate-500 hover:text-slate-700">
          ← All templates
        </Link>
      </div>

      <form action={uploadBackground} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <input type="hidden" name="templateId" value={template.id} />
        <label className="text-sm text-slate-600">
          Background scan (PNG/JPG of the blank diploma, oriented landscape):
        </label>
        <input type="file" name="file" accept="image/png,image/jpeg,image/webp" required className="text-sm" />
        <button type="submit" className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900">
          Upload / replace
        </button>
        {!template.backgroundImagePath && (
          <span className="text-sm text-amber-600">No background yet — upload one to calibrate visually.</span>
        )}
      </form>

      <Calibrator
        templateId={template.id}
        pageWidthMm={template.pageWidthMm}
        pageHeightMm={template.pageHeightMm}
        backgroundUrl={template.backgroundImagePath ? `/api/uploads/${template.backgroundImagePath}` : null}
        initialFields={fields}
      />
    </div>
  );
}
