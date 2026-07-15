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

// Resolve the text a field should display for a given student.
// Fixed-value fields (e.g. "Doctorat") ignore the student.
export function resolveFieldValue(field: FieldDefinition, student: Student | null): string {
  if (field.fixedValue && field.fixedValue.trim() !== "") return field.fixedValue;
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
  opts?: { includeNonPrintable?: boolean },
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
    value: resolveFieldValue(f, student),
  }));
}
