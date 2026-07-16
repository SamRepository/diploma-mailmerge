import type { FieldDefinition, Student } from "@prisma/client";
import type { SheetField } from "@/components/DiplomaSheet";

// Millimetre <-> CSS. We render at a fixed scale so 1mm maps to a predictable pixel size.
// The diploma sheet is rendered at PX_PER_MM and scaled with CSS transform for display.
export const PX_PER_MM = 3.7795275591; // 96 dpi (1mm = 96/25.4 px)

export function mmToPx(mm: number): number {
  return mm * PX_PER_MM;
}

// Student properties that hold a date. Dates are stored as free text (the import writes
// dd/mm/yyyy) so they are normalised for printing here rather than in the database — the
// stored value stays untouched and re-formatting never needs a migration.
const DATE_SOURCES = new Set(["birthDate", "issueDate", "pvDate"]);

// Print dates as YYYY/MM/DD with Western digits on both the Latin and Arabic sides.
// Accepts what the app can actually hold: dd/mm/yyyy (the importer's output), yyyy-mm-dd
// or yyyy/mm/dd (already ordered), and dd-mm-yyyy. Anything else is returned UNCHANGED —
// a date we cannot read confidently must print as typed rather than be mangled, since a
// wrong date on an official diploma is worse than an inconsistent one.
export function formatDiplomaDate(raw: string): string {
  const s = raw.trim();
  if (s === "") return s;

  const parts = s.split(/[/\-.]/).map((p) => p.trim());
  if (parts.length !== 3 || parts.some((p) => !/^\d+$/.test(p))) return raw;

  let year: string, month: string, day: string;
  if (parts[0].length === 4) {
    [year, month, day] = parts; // yyyy/mm/dd
  } else if (parts[2].length === 4) {
    [day, month, year] = parts; // dd/mm/yyyy
  } else {
    return raw; // two-digit year — ambiguous century, leave it alone
  }

  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2200) return raw;

  return `${String(y)}/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}`;
}

// Not a Student column: a value composed from several fields. Used by the QR, which encodes
// a readable summary of the diploma rather than a single value.
export const SUMMARY_SOURCE = "diplomaSummary";

// Plain-text summary encoded in the QR, mirroring the label order the ministry uses on the
// licence diploma so a scan reads the same way on both. Dates follow the printed diploma
// (YYYY/MM/DD) so the scan and the paper agree. Segments with no data are dropped rather
// than printed with an empty value — "Date of Deliberation:" followed by nothing reads as
// missing information on an official document.
export function buildDiplomaSummary(student: Student, degree: string): string {
  const parts: string[] = [];
  const push = (label: string, value: string | null | undefined) => {
    const v = (value ?? "").trim();
    if (v) parts.push(label ? `${label}: ${v}` : v);
  };

  push("", student.nameLatin);
  push("Born on", student.birthDate ? formatDiplomaDate(student.birthDate) : "");
  push("University", student.centerLatin);
  push("Branch", student.branchLatin);
  push("Speciality", student.specialityLatin);
  push("Date of Deliberation", student.pvDate ? formatDiplomaDate(student.pvDate) : "");
  push("Num", student.registrationCode);
  push("Degree", degree);

  return parts.join(" ");
}

// Fill {placeholder} tokens in a fixed value from the student's fields, so a fixed value can
// be a pattern like "DEN2101/2026/{matricule}/DOC/{registrationCode}". The literal parts
// (institution code, year, degree code) are edited in the calibrator; the {tokens} name a
// Student column and are substituted per student, with date columns formatted. A token whose
// column is empty or unknown becomes "" — the surrounding separators still print, so the
// admin can see a value is missing rather than the pattern silently collapsing.
function interpolateTemplate(template: string, student: Student): string {
  return template.replace(/\{(\w+)\}/g, (_m, key: string) => {
    const v = (student as unknown as Record<string, unknown>)[key];
    if (v == null) return "";
    const text = String(v);
    return DATE_SOURCES.has(key) ? formatDiplomaDate(text) : text;
  });
}

// Resolve the text a field should display for a given student.
// Fixed-value fields (e.g. "Doctorat") ignore the student, unless the fixed value contains
// {tokens}, in which case it is treated as a per-student pattern.
export function resolveFieldValue(
  field: FieldDefinition,
  student: Student | null,
  ctx?: { degree?: string },
): string {
  const fixed = field.fixedValue?.trim();
  if (fixed) {
    return student && fixed.includes("{") ? interpolateTemplate(fixed, student) : fixed;
  }
  if (field.source === SUMMARY_SOURCE) {
    return student ? buildDiplomaSummary(student, ctx?.degree ?? "") : "";
  }
  if (student && field.source) {
    const v = (student as unknown as Record<string, unknown>)[field.source];
    if (v != null) {
      const text = String(v);
      return DATE_SOURCES.has(field.source) ? formatDiplomaDate(text) : text;
    }
  }
  return "";
}

// Placeholder text for the calibrator when a field has no value, so the box stays visible.
export function fieldPlaceholder(field: FieldDefinition): string {
  return field.direction === "rtl" ? "نموذج" : field.label;
}

// Build the resolved sheet fields for a student. By default only printable fields are
// included (non-printable = pre-printed on the ministry paper).
export function buildSheetFields(
  fields: FieldDefinition[],
  student: Student | null,
  opts?: { includeNonPrintable?: boolean; degree?: string },
): SheetField[] {
  // Removed fields never reach paper, whatever the caller passes in. Callers filter in
  // their queries too; this is the last line of defence on every print path.
  const live = fields.filter((f) => !f.removed);
  const list = opts?.includeNonPrintable ? live : live.filter((f) => f.printable);
  return list.map((f) => ({
    id: f.id,
    xMm: f.xMm,
    yMm: f.yMm,
    widthMm: f.widthMm,
    fontSize: f.fontSize,
    fontFamily: f.fontFamily,
    align: (f.align as "left" | "center" | "right") ?? "left",
    direction: (f.direction as "ltr" | "rtl") ?? "ltr",
    kind: (f.kind as "text" | "qr") ?? "text",
    value: resolveFieldValue(f, student, { degree: opts?.degree }),
  }));
}
