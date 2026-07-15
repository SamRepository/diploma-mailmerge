import { Importer } from "./Importer";
import { requireUser } from "@/lib/session";

export default async function ImportPage() {
  await requireUser();
  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold text-slate-900">Import students</h1>
      <p className="mb-6 text-sm text-slate-500">
        Upload the ministry Excel export, map the columns to diploma fields, review, then import.
      </p>
      <Importer />
    </div>
  );
}
