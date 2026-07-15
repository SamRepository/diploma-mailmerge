// Single source of truth for the student data fields. Drives the CRUD form, the Excel
// import column-mapper, and (via `source` keys) the diploma field definitions.

export type StudentFieldKey =
  | "nameLatin"
  | "nameArabic"
  | "birthDate"
  | "birthPlaceLatin"
  | "birthPlaceArabic"
  | "domainLatin"
  | "domainArabic"
  | "branchLatin"
  | "branchArabic"
  | "specialityLatin"
  | "specialityArabic"
  | "gradeLatin"
  | "gradeArabic"
  | "centerLatin"
  | "centerArabic"
  | "issuePlace"
  | "issueDate"
  | "serialNumber"
  | "registrationCode";

export type StudentFieldDef = {
  key: StudentFieldKey;
  label: string;
  arabic: boolean;
  required: boolean;
  group: "Identity" | "Diploma" | "Issuance";
  // Aliases used to auto-match spreadsheet column headers (lowercased, includes-match).
  aliases: string[];
};

// Aliases include the exact Arabic column headers from the ministry export. Because the
// Latin columns repeat the Arabic label + " بالأنجليزية", and Arabic columns come first,
// guessHeader (first-includes-match) resolves each side correctly.
export const STUDENT_FIELDS: StudentFieldDef[] = [
  { key: "nameLatin", label: "Name (Latin)", arabic: false, required: true, group: "Identity", aliases: ["السيد(ة) بالأنجليزية", "name", "nom", "full name", "student"] },
  { key: "nameArabic", label: "Name (Arabic)", arabic: true, required: false, group: "Identity", aliases: ["السيد(ة) بالعربية", "بالعربية", "الاسم", "اللقب"] },
  { key: "birthDate", label: "Birth date", arabic: false, required: false, group: "Identity", aliases: ["المولود (ة) في", "birth", "born", "naissance", "date de naissance"] },
  { key: "birthPlaceLatin", label: "Birth place (Latin)", arabic: false, required: false, group: "Identity", aliases: ["ب: الأنجليزية", "place", "lieu", "birth place"] },
  { key: "birthPlaceArabic", label: "Birth place (Arabic)", arabic: true, required: false, group: "Identity", aliases: ["ب:", "مكان الميلاد"] },
  { key: "domainLatin", label: "Domain (Latin)", arabic: false, required: false, group: "Diploma", aliases: ["الميدان بالأنجليزية", "domain", "domaine"] },
  { key: "domainArabic", label: "Domain (Arabic)", arabic: true, required: false, group: "Diploma", aliases: ["الميدان"] },
  { key: "branchLatin", label: "Branch (Latin)", arabic: false, required: false, group: "Diploma", aliases: ["الشعبة بالأنجليزية", "branch", "filiere", "filière"] },
  { key: "branchArabic", label: "Branch (Arabic)", arabic: true, required: false, group: "Diploma", aliases: ["الشعبة"] },
  { key: "specialityLatin", label: "Speciality (Latin)", arabic: false, required: false, group: "Diploma", aliases: ["التخصص بالأنجليزية", "special", "specialite", "spécialité", "option"] },
  { key: "specialityArabic", label: "Speciality (Arabic)", arabic: true, required: false, group: "Diploma", aliases: ["التخصص"] },
  { key: "gradeLatin", label: "Grade (Latin)", arabic: false, required: false, group: "Diploma", aliases: ["التقدير بالأنجليزية", "grade", "mention", "appreciation"] },
  { key: "gradeArabic", label: "Grade (Arabic)", arabic: true, required: false, group: "Diploma", aliases: ["التقدير"] },
  { key: "centerLatin", label: "Center (Latin)", arabic: false, required: false, group: "Issuance", aliases: ["المؤسسة الجامعية بالأنجليزية", "center", "centre", "institution", "university"] },
  { key: "centerArabic", label: "Center (Arabic)", arabic: true, required: false, group: "Issuance", aliases: ["المؤسسة الجامعية"] },
  { key: "issuePlace", label: "Issue place", arabic: false, required: false, group: "Issuance", aliases: ["حرر في", "issue place", "lieu de delivrance", "place issued"] },
  { key: "issueDate", label: "Issue date", arabic: false, required: false, group: "Issuance", aliases: ["بتاريخ", "issue date", "date de delivrance", "delivered"] },
  { key: "serialNumber", label: "Serial N° (pre-printed)", arabic: false, required: false, group: "Issuance", aliases: ["serial", "n°", "numero"] },
  { key: "registrationCode", label: "Registration N° (printed)", arabic: false, required: false, group: "Issuance", aliases: ["تحت رقم", "registration", "matricule", "reference"] },
];

export const STUDENT_FIELD_MAP: Record<StudentFieldKey, StudentFieldDef> = Object.fromEntries(
  STUDENT_FIELDS.map((f) => [f.key, f]),
) as Record<StudentFieldKey, StudentFieldDef>;

export const STUDENT_GROUPS = ["Identity", "Diploma", "Issuance"] as const;

// Auto-guess which spreadsheet header maps to a given field. Returns the header or "".
export function guessHeader(field: StudentFieldDef, headers: string[]): string {
  const norm = (s: string) => s.toLowerCase().trim();
  const labelWords = norm(field.label).replace(/[()]/g, "");
  for (const h of headers) {
    const nh = norm(h);
    if (nh === norm(field.key) || nh === labelWords) return h;
    for (const a of field.aliases) {
      if (nh.includes(norm(a))) return h;
    }
  }
  return "";
}
