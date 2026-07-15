import type { FieldDefinition, Student } from "@prisma/client";
import type { SheetField } from "@/components/DiplomaSheet";

// Millimetre <-> CSS. We render at a fixed scale so 1mm maps to a predictable pixel size.
// The diploma sheet is rendered at PX_PER_MM and scaled with CSS transform for display.
export const PX_PER_MM = 3.7795275591; // 96 dpi (1mm = 96/25.4 px)

export function mmToPx(mm: number): number {
  return mm * PX_PER_MM;
}

// Resolve the text a field should display for a given student.
// Fixed-value fields (e.g. "Doctorat") ignore the student.
export function resolveFieldValue(field: FieldDefinition, student: Student | null): string {
  if (field.fixedValue && field.fixedValue.trim() !== "") return field.fixedValue;
  if (student && field.source) {
    const v = (student as unknown as Record<string, unknown>)[field.source];
    if (v != null) return String(v);
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
  const list = opts?.includeNonPrintable ? fields : fields.filter((f) => f.printable);
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
