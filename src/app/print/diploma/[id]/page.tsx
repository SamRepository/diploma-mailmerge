import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isValidRenderToken } from "@/lib/renderToken";
import { buildSheetFields } from "@/lib/diploma";
import { withQrCodes } from "@/lib/diplomaServer";
import { DiplomaSheet } from "@/components/DiplomaSheet";

// Minimal, chrome-free page rendered by headless Chromium for PDF export and by the
// print flow. Outside the (app) group, so no navigation bar. Still auth-guarded.
export default async function PrintDiplomaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bg?: string; offX?: string; offY?: string; token?: string }>;
}) {
  const { id } = await params;
  const { bg, offX, offY, token } = await searchParams;

  // Accessible either by a logged-in user or by the internal render token (headless PDF).
  if (!isValidRenderToken(token)) {
    const session = await auth();
    if (!session?.user) redirect("/login");
  }

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) notFound();

  const template = await prisma.template.findFirst({
    where: student.templateId ? { id: student.templateId } : { active: true },
    include: { fields: { where: { removed: false }, orderBy: { order: "asc" } } },
  });
  if (!template) notFound();

  const withBg = bg === "1";
  const fields = await withQrCodes(buildSheetFields(template.fields, student, { degree: template.degreeType }));

  return (
    <div className={`diploma-print-root ${withBg ? "with-bg" : ""}`}>
      <DiplomaSheet
        id="diploma-print"
        widthMm={template.pageWidthMm}
        heightMm={template.pageHeightMm}
        backgroundUrl={template.backgroundImagePath ? `/api/uploads/${template.backgroundImagePath}` : null}
        showBackground={withBg}
        fields={fields}
        offsetXMm={Number(offX) || 0}
        offsetYMm={Number(offY) || 0}
      />
    </div>
  );
}
