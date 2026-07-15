import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { buildSheetFields } from "@/lib/diploma";
import { withQrCodes } from "@/lib/diplomaServer";
import { DiplomaPreview } from "./DiplomaPreview";

export default async function DiplomaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) notFound();

  const template = await prisma.template.findFirst({
    where: student.templateId ? { id: student.templateId } : { active: true },
    include: { fields: { where: { removed: false }, orderBy: { order: "asc" } } },
  });

  if (!template) {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 p-4 text-amber-800">
        No template is configured. Ask an admin to set one up under{" "}
        <Link href="/templates" className="underline">Templates</Link>.
      </div>
    );
  }

  const fields = await withQrCodes(buildSheetFields(template.fields, student, { degree: template.degreeType }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Diploma — {student.nameLatin}</h1>
        <Link href="/students" className="text-sm text-slate-500 hover:text-slate-700">
          ← Students
        </Link>
      </div>

      {!template.backgroundImagePath && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This template has no background scan yet — the preview shows data only. An admin can add one under Templates.
        </div>
      )}

      <DiplomaPreview
        studentId={student.id}
        studentName={student.nameLatin}
        templateId={template.id}
        widthMm={template.pageWidthMm}
        heightMm={template.pageHeightMm}
        backgroundUrl={template.backgroundImagePath ? `/api/uploads/${template.backgroundImagePath}` : null}
        fields={fields}
        initialStatus={student.printStatus}
      />
    </div>
  );
}
