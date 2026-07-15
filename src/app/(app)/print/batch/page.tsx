import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { BatchPrint, type BatchStudent } from "./BatchPrint";
import { HelpLink } from "@/components/HelpLink";

export default async function BatchPrintPage() {
  await requireUser();

  const students = await prisma.student.findMany({
    orderBy: [{ printStatus: "asc" }, { nameLatin: "asc" }],
    take: 500,
  });
  const template = await prisma.template.findFirst({ where: { active: true } });

  const rows: BatchStudent[] = students.map((s) => ({
    id: s.id,
    nameLatin: s.nameLatin,
    nameArabic: s.nameArabic,
    specialityLatin: s.specialityLatin,
    printStatus: s.printStatus,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-slate-900">Bulk print</h1>
        <HelpLink anchor="print-batch" className="text-sm" />
      </div>
      <p className="text-sm text-slate-500">
        Select students, then export a single merged PDF (one A4-landscape page each). Use “data only” to print onto
        the pre-printed diplomas, or “with background” for complete archival copies.
      </p>
      <BatchPrint students={rows} templateId={template?.id ?? ""} />
    </div>
  );
}
