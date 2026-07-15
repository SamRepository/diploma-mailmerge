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

export async function importStudents(rows: unknown): Promise<{ inserted: number; skipped: number; error?: string }> {
  const user = await requireUser();
  const parsed = z.array(importRowSchema).safeParse(rows);
  if (!parsed.success) return { inserted: 0, skipped: 0, error: "Malformed import payload" };

  const templateId = await defaultTemplateId();
  let inserted = 0;
  let skipped = 0;

  for (const raw of parsed.data) {
    const data: Record<string, string | null> = {};
    for (const f of STUDENT_FIELDS) {
      const v = raw[f.key as StudentFieldKey];
      data[f.key] = v == null || String(v).trim() === "" ? null : String(v).trim();
    }
    if (!data.nameLatin) {
      skipped++;
      continue;
    }
    await prisma.student.create({ data: { ...(data as Record<string, string | null>), nameLatin: data.nameLatin, templateId } });
    inserted++;
  }

  await prisma.auditLog.create({
    data: { userId: user.id, action: "STUDENT_IMPORT", detail: `inserted=${inserted} skipped=${skipped}` },
  });
  revalidatePath("/students");
  return { inserted, skipped };
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
