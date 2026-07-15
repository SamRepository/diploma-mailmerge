import { Importer } from "./Importer";
import { requireUser } from "@/lib/session";
import { HelpLink } from "@/components/HelpLink";

export default async function ImportPage() {
  await requireUser();
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-slate-900">Import students</h1>
        <HelpLink anchor="import" className="text-sm" />
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Upload the ministry Excel export, map the columns to diploma fields, review, then import.
      </p>
      <Importer />
    </div>
  );
}
