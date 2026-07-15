import { notFound } from "next/navigation";
import { StudentForm } from "@/components/StudentForm";
import { updateStudent, type StudentActionState } from "@/lib/students";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { StudentFieldKey } from "@/lib/studentFields";

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) notFound();

  const action = async (prev: StudentActionState, formData: FormData) => {
    "use server";
    return updateStudent(id, prev, formData);
  };

  const initial = student as unknown as Partial<Record<StudentFieldKey, string | null>>;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Edit student</h1>
      <StudentForm action={action} initial={initial} submitLabel="Save changes" />
    </div>
  );
}
