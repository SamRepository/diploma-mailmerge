"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STUDENT_FIELDS, guessHeader } from "@/lib/studentFields";
import { importStudents } from "@/lib/students";

type Row = Record<string, string>;

// Format a raw spreadsheet cell to a trimmed string. Real date cells (parsed via
// cellDates) are rendered as dd/mm/yyyy to match the diploma's printed format,
// instead of SheetJS's locale-dependent M/D/YY strings.
function formatCell(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date && !isNaN(v.getTime())) {
    const dd = String(v.getDate()).padStart(2, "0");
    const mm = String(v.getMonth() + 1).padStart(2, "0");
    const yyyy = v.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return String(v).trim();
}

export function Importer() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [guessed, setGuessed] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: true, blankrows: false });
      if (matrix.length < 2) {
        setError("The first sheet has no data rows.");
        return;
      }
      const hdrs = (matrix[0] as unknown[]).map((h) => String(h ?? "").trim());
      const dataRows: Row[] = [];
      for (let i = 1; i < matrix.length; i++) {
        const arr = matrix[i] as unknown[];
        const row: Row = {};
        hdrs.forEach((h, idx) => (row[h] = formatCell(arr[idx])));
        if (Object.values(row).some((v) => v !== "")) dataRows.push(row);
      }

      // Auto-guess mapping.
      const map: Record<string, string> = {};
      const guess: Record<string, boolean> = {};
      for (const f of STUDENT_FIELDS) {
        const g = guessHeader(f, hdrs);
        map[f.key] = g;
        guess[f.key] = g !== "";
      }

      setHeaders(hdrs);
      setRows(dataRows);
      setMapping(map);
      setGuessed(guess);
    } catch (err) {
      setError("Could not read the file. Make sure it is a valid .xls/.xlsx.");
      console.error(err);
    }
  }

  function setField(key: string, header: string) {
    setMapping((m) => ({ ...m, [key]: header }));
    setGuessed((g) => ({ ...g, [key]: false })); // manual override
  }

  async function onImport() {
    setError(null);
    if (!mapping.nameLatin) {
      setError("Name (Latin) must be mapped — it is required.");
      return;
    }
    setBusy(true);
    try {
      const mapped = rows.map((r) => {
        const out: Record<string, string | null> = {};
        for (const f of STUDENT_FIELDS) {
          const h = mapping[f.key];
          out[f.key] = h ? (r[h] ?? "") : null;
        }
        return out;
      });
      const res = await importStudents(mapped);
      if (res.error) {
        setError(res.error);
      } else {
        setResult(`Imported ${res.inserted} students (${res.skipped} skipped — missing name).`);
        setRows([]);
        setHeaders([]);
        router.refresh();
      }
    } catch (err) {
      setError("Import failed. See console.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  const previewRows = rows.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="block text-sm font-medium text-slate-700">Choose an Excel file (.xls / .xlsx)</label>
        <input type="file" accept=".xls,.xlsx" onChange={onFile} className="mt-2 text-sm" />
        {fileName && <p className="mt-2 text-sm text-slate-500">Loaded: {fileName} — {rows.length} data rows.</p>}
        <p className="mt-2 text-xs text-slate-400">
          The file is parsed in your browser; only the mapped rows are sent to the server when you click Import.
        </p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {result && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{result}</div>}

      {headers.length > 0 && (
        <>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-1 font-medium text-slate-900">Map columns</h2>
            <p className="mb-3 text-xs text-slate-500">
              <span className="rounded bg-amber-100 px-1 text-amber-700">amber</span> = auto-guessed, review it.
              Unmapped fields are left blank.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {STUDENT_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-sm">
                  <span className="w-40 shrink-0 text-slate-600">
                    {f.label}
                    {f.required && <span className="text-red-500"> *</span>}
                  </span>
                  <select
                    value={mapping[f.key] ?? ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                    className={`flex-1 rounded border px-2 py-1 text-sm ${
                      guessed[f.key] ? "border-amber-300 bg-amber-50" : "border-slate-300"
                    }`}
                  >
                    <option value="">— not mapped —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 font-medium text-slate-900">Preview (first {previewRows.length})</h2>
            <table className="w-full text-xs">
              <thead className="text-left text-slate-500">
                <tr>
                  {STUDENT_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                    <th key={f.key} className="px-2 py-1 font-medium">{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {STUDENT_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                      <td key={f.key} dir={f.arabic ? "rtl" : "ltr"} className={`px-2 py-1 ${f.arabic ? "font-arabic" : ""}`}>
                        {r[mapping[f.key]]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={onImport}
            disabled={busy}
            className="rounded bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? "Importing…" : `Import ${rows.length} students`}
          </button>
        </>
      )}
    </div>
  );
}
