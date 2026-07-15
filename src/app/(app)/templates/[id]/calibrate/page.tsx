import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { resolveFieldValue } from "@/lib/diploma";
import { Calibrator, type CalibratorField } from "./Calibrator";
import { BackgroundUploadForm } from "./BackgroundUploadForm";
import { HelpLink } from "@/components/HelpLink";

export default async function CalibratePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const template = await prisma.template.findUnique({
    where: { id },
    // Removed fields are fetched too — they are listed as restorable rather than hidden,
    // so a field taken off the template can be put back without re-running the seed.
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!template) notFound();

  const sample = await prisma.student.findFirst({ where: { templateId: id }, orderBy: { createdAt: "asc" } });

  const toCalibratorField = (f: (typeof template.fields)[number]): CalibratorField => ({
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
    // Resolve through the same helper the printed sheet uses, so the calibrator shows the
    // value that will actually be printed — dates included. Reading the student property
    // directly here would skip the date formatting and misrepresent the layout.
    sampleValue: resolveFieldValue(f, sample, { degree: template.degreeType }),
  });

  const fields = template.fields.filter((f) => !f.removed).map(toCalibratorField);
  const removedFields = template.fields.filter((f) => f.removed).map(toCalibratorField);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Calibrate — {template.name}</h1>
        <div className="flex items-center gap-3">
          <HelpLink anchor="calibrate" className="text-sm" />
          <Link href="/templates" className="text-sm text-slate-500 hover:text-slate-700">
            ← All templates
          </Link>
        </div>
      </div>

      <BackgroundUploadForm templateId={template.id} hasBackground={!!template.backgroundImagePath} />

      <Calibrator
        templateId={template.id}
        pageWidthMm={template.pageWidthMm}
        pageHeightMm={template.pageHeightMm}
        backgroundUrl={template.backgroundImagePath ? `/api/uploads/${template.backgroundImagePath}` : null}
        initialFields={fields}
        initialRemovedFields={removedFields}
      />
    </div>
  );
}
