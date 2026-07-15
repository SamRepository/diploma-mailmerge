"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { STUDENT_FIELDS, type StudentFieldKey } from "@/lib/studentFields";

const optionalStr = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

const studentSchema = z.object({
  nameLatin: z.string().trim().min(1, "Name (Latin) is required"),
  nameArabic: optionalStr,
  birthDate: optionalStr,
  birthPlaceLatin: optionalStr,
  birthPlaceArabic: optionalStr,
  domainLatin: optionalStr,
  domainArabic: optionalStr,
  branchLatin: optionalStr,
  branchArabic: optionalStr,
  specialityLatin: optionalStr,
  specialityArabic: optionalStr,
  gradeLatin: optionalStr,
  gradeArabic: optionalStr,
  centerLatin: optionalStr,
  centerArabic: optionalStr,
  issuePlace: optionalStr,
  issueDate: optionalStr,
  pvDate: optionalStr,
  serialNumber: optionalStr,
  registrationCode: optionalStr,
});

export type StudentActionState = { error?: string };

function formToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const f of STUDENT_FIELDS) obj[f.key] = formData.get(f.key);
  return obj;
}

async function defaultTemplateId(): Promise<string | null> {
  const t = await prisma.template.findFirst({ where: { active: true }, orderBy: { createdAt: "asc" } });
  return t?.id ?? null;
}

export async function createStudent(_prev: StudentActionState, formData: FormData): Promise<StudentActionState> {
  const user = await requireUser();
  const parsed = studentSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const student = await prisma.student.create({
    data: { ...parsed.data, templateId: await defaultTemplateId() },
  });
  await prisma.auditLog.create({
    data: { userId: user.id, studentId: student.id, action: "STUDENT_CREATE", detail: student.nameLatin },
  });

  revalidatePath("/students");
  redirect(`/students`);
}

export async function updateStudent(id: string, _prev: StudentActionState, formData: FormData): Promise<StudentActionState> {
  const user = await requireUser();
  const parsed = studentSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await prisma.student.update({ where: { id }, data: parsed.data });
  await prisma.auditLog.create({
    data: { userId: user.id, studentId: id, action: "STUDENT_UPDATE", detail: parsed.data.nameLatin },
  });

  revalidatePath("/students");
  redirect(`/students`);
}

export async function deleteStudent(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return;
  await prisma.auditLog.create({
    data: { userId: user.id, action: "STUDENT_DELETE", detail: student.nameLatin },
  });
  await prisma.student.delete({ where: { id } });
  revalidatePath("/students");
}

// Bulk import: rows already mapped client-side to student field keys.
const importRowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.null()]));

// "update" matches each row against an existing student and edits it in place; "insert"
// adds every row as a new student. Update is the default: the ministry re-sends the whole
// cohort when it corrects a few cells, so inserting would duplicate the entire list.
export type ImportMode = "insert" | "update";
const importModeSchema = z.enum(["insert", "update"]);

export type ImportResult = {
  inserted: number;
  updated: number;
  skipped: number;
  conflicts: string[];
  error?: string;
};

// Match key for an existing student. Case- and whitespace-insensitive so that a re-export
// with cosmetic spacing changes ("CHEBOUKI  Sonia") still matches the stored row.
function matchKey(nameLatin: string): string {
  return nameLatin.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function importStudents(rows: unknown, mode: ImportMode = "update"): Promise<ImportResult> {
  const user = await requireUser();
  const empty = { inserted: 0, updated: 0, skipped: 0, conflicts: [] };
  const parsed = z.array(importRowSchema).safeParse(rows);
  if (!parsed.success) return { ...empty, error: "Malformed import payload" };
  const parsedMode = importModeSchema.safeParse(mode);
  if (!parsedMode.success) return { ...empty, error: "Invalid import mode" };

  const templateId = await defaultTemplateId();

  // Index existing students by match key. A Latin name that is not unique cannot be matched
  // safely, so it maps to null and is reported as a conflict rather than updating a guess.
  const index = new Map<string, string | null>();
  if (parsedMode.data === "update") {
    for (const s of await prisma.student.findMany({ select: { id: true, nameLatin: true } })) {
      const k = matchKey(s.nameLatin);
      index.set(k, index.has(k) ? null : s.id);
    }
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const conflicts: string[] = [];
  const auditRows: { userId: string; studentId: string; action: string; detail: string }[] = [];

  for (const raw of parsed.data) {
    // Only fields the file actually carries. A column the export omits (or leaves blank)
    // must never null out data already in the DB — the pre-printed serial N° and any
    // hand-entered correction live only here.
    const values: Record<string, string> = {};
    for (const f of STUDENT_FIELDS) {
      const v = raw[f.key as StudentFieldKey];
      const s = v == null ? "" : String(v).trim();
      if (s) values[f.key] = s;
    }
    const nameLatin = values.nameLatin;
    if (!nameLatin) {
      skipped++;
      continue;
    }

    const existingId = parsedMode.data === "update" ? index.get(matchKey(nameLatin)) : undefined;
    if (existingId === null) {
      conflicts.push(nameLatin);
      skipped++;
      continue;
    }

    if (existingId) {
      await prisma.student.update({ where: { id: existingId }, data: values });
      auditRows.push({
        userId: user.id,
        studentId: existingId,
        action: "STUDENT_UPDATE",
        detail: `import: ${Object.keys(values).join(", ")}`,
      });
      updated++;
    } else {
      await prisma.student.create({ data: { ...values, nameLatin, templateId } });
      inserted++;
    }
  }

  if (auditRows.length) await prisma.auditLog.createMany({ data: auditRows });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "STUDENT_IMPORT",
      detail: `mode=${parsedMode.data} inserted=${inserted} updated=${updated} skipped=${skipped}`,
    },
  });
  revalidatePath("/students");
  return { inserted, updated, skipped, conflicts };
}

export async function setManyPrintStatus(ids: string[], status: "PENDING" | "PRINTED"): Promise<{ count: number }> {
  const user = await requireUser();
  const res = await prisma.student.updateMany({
    where: { id: { in: ids } },
    data: { printStatus: status, printedAt: status === "PRINTED" ? new Date() : null },
  });
  await prisma.auditLog.create({
    data: { userId: user.id, action: `PRINT_STATUS_${status}_BULK`, detail: `count=${res.count}` },
  });
  revalidatePath("/students");
  revalidatePath("/print/batch");
  return { count: res.count };
}

export async function setPrintStatus(id: string, status: "PENDING" | "PRINTED"): Promise<void> {
  const user = await requireUser();
  await prisma.student.update({
    where: { id },
    data: { printStatus: status, printedAt: status === "PRINTED" ? new Date() : null },
  });
  await prisma.auditLog.create({ data: { userId: user.id, studentId: id, action: `PRINT_STATUS_${status}` } });
  revalidatePath("/students");
}
