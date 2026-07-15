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
  // QR square encoding the registration number by default (change its source/fixed value
  // once the ministry verification format is confirmed). Positioned bottom-left.
  { key: "qr_registration", source: "registrationCode", label: "QR code", xMm: 20, yMm: 150, widthMm: 22, fontSize: 9, kind: "qr", order: 19, ...LATIN },
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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
