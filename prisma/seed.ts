import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Default PhD field set, mirrored Latin (left) + Arabic (right) as on the diploma.
// Coordinates are rough starting points in millimetres on an A4-landscape page
// (297 x 210). They are meant to be CALIBRATED in the app against a real scan —
// do not treat these as final.
type SeedField = {
  key: string;
  source: string | null;
  label: string;
  lang: "LATIN" | "ARABIC";
  xMm: number;
  yMm: number;
  widthMm: number;
  fontSize: number;
  align: "left" | "center" | "right";
  direction: "ltr" | "rtl";
  printable?: boolean;
  fixedValue?: string | null;
  kind?: "text" | "qr";
  order: number;
};

const LATIN = { lang: "LATIN" as const, direction: "ltr" as const, align: "left" as const, fontFamily: "serif" };
const ARABIC = { lang: "ARABIC" as const, direction: "rtl" as const, align: "right" as const, fontFamily: "arabic" };

const phdFields: SeedField[] = [
  { key: "name_latin", source: "nameLatin", label: "Name (Latin)", xMm: 70, yMm: 70, widthMm: 90, fontSize: 12, order: 1, ...LATIN },
  { key: "name_ar", source: "nameArabic", label: "Name (Arabic)", xMm: 200, yMm: 70, widthMm: 80, fontSize: 12, order: 2, ...ARABIC },
  { key: "birth_latin", source: "birthDate", label: "Born on (Latin)", xMm: 60, yMm: 82, widthMm: 40, fontSize: 11, order: 3, ...LATIN },
  { key: "birth_ar", source: "birthDate", label: "Born on (Arabic)", xMm: 200, yMm: 82, widthMm: 40, fontSize: 11, order: 4, ...ARABIC },
  { key: "birthplace_latin", source: "birthPlaceLatin", label: "Born in (Latin)", xMm: 120, yMm: 82, widthMm: 50, fontSize: 11, order: 5, ...LATIN },
  { key: "birthplace_ar", source: "birthPlaceArabic", label: "Born in (Arabic)", xMm: 150, yMm: 82, widthMm: 40, fontSize: 11, order: 6, ...ARABIC },
  { key: "domain_latin", source: "domainLatin", label: "Domain (Latin)", xMm: 70, yMm: 100, widthMm: 100, fontSize: 11, order: 7, ...LATIN },
  { key: "domain_ar", source: "domainArabic", label: "Domain (Arabic)", xMm: 190, yMm: 100, widthMm: 90, fontSize: 11, order: 8, ...ARABIC },
  { key: "branch_latin", source: "branchLatin", label: "Branch (Latin)", xMm: 70, yMm: 110, widthMm: 100, fontSize: 11, order: 9, ...LATIN },
  { key: "branch_ar", source: "branchArabic", label: "Branch (Arabic)", xMm: 190, yMm: 110, widthMm: 90, fontSize: 11, order: 10, ...ARABIC },
  { key: "speciality_latin", source: "specialityLatin", label: "Speciality (Latin)", xMm: 70, yMm: 120, widthMm: 100, fontSize: 11, order: 11, ...LATIN },
  { key: "speciality_ar", source: "specialityArabic", label: "Speciality (Arabic)", xMm: 190, yMm: 120, widthMm: 90, fontSize: 11, order: 12, ...ARABIC },
  { key: "grade_latin", source: "gradeLatin", label: "Grade (Latin)", xMm: 100, yMm: 92, widthMm: 60, fontSize: 11, order: 13, ...LATIN },
  { key: "grade_ar", source: "gradeArabic", label: "Grade (Arabic)", xMm: 175, yMm: 92, widthMm: 45, fontSize: 11, order: 18, ...ARABIC },
  { key: "center_latin", source: "centerLatin", label: "Center (Latin)", xMm: 70, yMm: 132, widthMm: 100, fontSize: 11, order: 14, ...LATIN },
  { key: "center_ar", source: "centerArabic", label: "Center (Arabic)", xMm: 190, yMm: 132, widthMm: 90, fontSize: 11, order: 15, ...ARABIC },
  { key: "issue_date", source: "issueDate", label: "Issue date", xMm: 150, yMm: 145, widthMm: 40, fontSize: 10, order: 16, ...LATIN },
  { key: "registration_code", source: "registrationCode", label: "Registration code", xMm: 30, yMm: 175, widthMm: 80, fontSize: 9, order: 17, ...LATIN },
  // Issued-at city. Constant for every PhD diploma, so it carries a fixedValue and has no
  // student source. Edit it in the calibrator if the issuing town ever changes.
  { key: "issue_place_ar", source: null, fixedValue: "عزابة", label: "Issued at (Arabic)", xMm: 210, yMm: 145, widthMm: 30, fontSize: 10, order: 20, ...ARABIC },
  // Issue date on the Arabic side, pairing the existing Latin issue_date.
  { key: "issue_date_ar", source: "issueDate", label: "Issue date (Arabic)", xMm: 175, yMm: 145, widthMm: 32, fontSize: 10, order: 21, ...ARABIC },
  // محضر لجنة المداولات بتاريخ — deliberation-committee minutes date.
  { key: "pv_date_latin", source: "pvDate", label: "PV date (Latin)", xMm: 150, yMm: 152, widthMm: 40, fontSize: 10, order: 22, ...LATIN },
  { key: "pv_date_ar", source: "pvDate", label: "PV date (Arabic)", xMm: 175, yMm: 152, widthMm: 32, fontSize: 10, order: 23, ...ARABIC },
  // The ministry blank already carries its own serial N°, so this is NOT printed: it is
  // here to position against the pre-printed number when checking alignment, and to keep
  // the recorded serial visible while calibrating. Leave it non-printable.
  { key: "serial_number", source: "serialNumber", label: "Serial N° (pre-printed)", xMm: 235, yMm: 28, widthMm: 40, fontSize: 10, printable: false, order: 24, ...LATIN },
  // Signatory title in the signature area. Constant for every PhD diploma, so it carries a
  // fixedValue and no student source. Edit the exact title in the calibrator's Fixed value
  // box; if this text is already pre-printed on the ministry blank, uncheck Printable.
  { key: "signatory_ar", source: null, fixedValue: "إمضاء مدير الجامعة", label: "Signature title (Arabic)", xMm: 205, yMm: 165, widthMm: 70, fontSize: 11, order: 25, ...ARABIC },
  // QR square. `diplomaSummary` is not a Student column — it is composed in lib/diploma.ts
  // (SUMMARY_SOURCE) from the Latin fields, mirroring the label order the ministry uses in
  // the licence diploma's QR, so a scan reads the same on both. Positioned bottom-left.
  // 26 mm: the summary payload is ~220 characters, so the code is dense — at the old 22 mm
  // the modules land near the limit of what a phone camera resolves off paper.
  { key: "qr_registration", source: "diplomaSummary", label: "QR code (diploma summary)", xMm: 20, yMm: 150, widthMm: 26, fontSize: 9, kind: "qr", order: 19, ...LATIN },
];

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "admin1234";
  const name = process.env.ADMIN_NAME ?? "Administrator";

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash, role: "ADMIN" },
  });
  console.log(`Admin user ready: ${admin.email}`);

  // PhD template (idempotent by name).
  let template = await prisma.template.findFirst({ where: { name: "PhD (Doctorat)" } });
  if (!template) {
    template = await prisma.template.create({
      data: {
        name: "PhD (Doctorat)",
        degreeType: "Doctorat",
        pageWidthMm: 297,
        pageHeightMm: 210,
        active: true,
      },
    });
    console.log(`Template created: ${template.name}`);
  } else {
    console.log(`Template already exists: ${template.name}`);
  }

  for (const f of phdFields) {
    const { fixedValue = null, printable = true, kind = "text", ...rest } = f;
    const fontFamily = f.lang === "ARABIC" ? "arabic" : "serif";
    await prisma.fieldDefinition.upsert({
      where: { templateId_key: { templateId: template.id, key: f.key } },
      update: {},
      create: {
        templateId: template.id,
        key: rest.key,
        source: rest.source,
        kind,
        label: rest.label,
        lang: rest.lang,
        xMm: rest.xMm,
        yMm: rest.yMm,
        widthMm: rest.widthMm,
        fontSize: rest.fontSize,
        fontFamily,
        align: rest.align,
        direction: rest.direction,
        printable,
        fixedValue,
        order: rest.order,
      },
    });
  }
  console.log(`Seeded ${phdFields.length} field definitions.`);

  // The QR used to encode the bare registration number. Existing templates keep their row
  // (upsert leaves it alone, which is what preserves calibration), so repoint the source
  // here. Scoped to rows still on the old source, so it is a no-op once applied and never
  // overrides a source an admin has since changed.
  const repointed = await prisma.fieldDefinition.updateMany({
    where: { kind: "qr", source: "registrationCode" },
    data: { source: "diplomaSummary", label: "QR code (diploma summary)" },
  });
  if (repointed.count > 0) {
    console.log(`Repointed ${repointed.count} QR field(s) from the registration number to the diploma summary.`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
