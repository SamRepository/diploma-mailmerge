import { StudentForm } from "@/components/StudentForm";
import { createStudent } from "@/lib/students";
import { requireUser } from "@/lib/session";

export default async function NewStudentPage() {
  await requireUser();
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Add student</h1>
      <StudentForm action={createStudent} submitLabel="Create student" />
    </div>
  );
}
