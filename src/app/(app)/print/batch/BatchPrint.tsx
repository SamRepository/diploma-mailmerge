"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setManyPrintStatus } from "@/lib/students";

export type BatchStudent = {
  id: string;
  nameLatin: string;
  nameArabic: string | null;
  specialityLatin: string | null;
  printStatus: string;
};

export function BatchPrint({ students, templateId }: { students: BatchStudent[]; templateId: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bg, setBg] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);

  // Reuse the per-machine alignment offset saved on the single-diploma screen.
  useEffect(() => {
    if (!templateId) return;
    const saved = localStorage.getItem(`diploma-offset-${templateId}`);
    if (saved) {
      try {
        const o = JSON.parse(saved);
        setOffX(Number(o.x) || 0);
        setOffY(Number(o.y) || 0);
      } catch {}
    }
  }, [templateId]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAll() {
    setSelected(new Set(students.map((s) => s.id)));
  }
  function selectPending() {
    setSelected(new Set(students.filter((s) => s.printStatus !== "PRINTED").map((s) => s.id)));
  }
  function clearSel() {
    setSelected(new Set());
  }

  const ids = [...selected];

  async function exportPdf() {
    if (ids.length === 0) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/print/batch/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, bg, offX, offY }),
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMsg(`Exported ${ids.length} diploma(s).`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function markPrinted() {
    if (ids.length === 0) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await setManyPrintStatus(ids, "PRINTED");
      setMsg(`Marked ${res.count} as printed.`);
      router.refresh();
      clearSel();
    } catch {
      setError("Could not update status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
        <span className="font-medium text-slate-700">{selected.size} selected</span>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <button onClick={selectPending} className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100">Select pending</button>
        <button onClick={selectAll} className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100">Select all</button>
        <button onClick={clearSel} className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100">Clear</button>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <label className="flex items-center gap-1"><input type="checkbox" checked={bg} onChange={(e) => setBg(e.target.checked)} /> With background</label>
        <span className="text-xs text-slate-400">offset {offX},{offY} mm</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={exportPdf} disabled={busy || ids.length === 0} className="rounded bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {busy ? "Working…" : "Export merged PDF"}
          </button>
          <button onClick={markPrinted} disabled={busy || ids.length === 0} className="rounded bg-green-600 px-3 py-1.5 font-medium text-white hover:bg-green-700 disabled:opacity-50">
            Mark printed
          </button>
        </div>
      </div>

      {msg && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>}
      {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="w-10 px-4 py-2"></th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Speciality</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.id} className={selected.has(s.id) ? "bg-indigo-50/50" : "hover:bg-slate-50"}>
                <td className="px-4 py-2">
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                </td>
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-900">{s.nameLatin}</div>
                  {s.nameArabic && <div dir="rtl" className="font-arabic text-slate-500">{s.nameArabic}</div>}
                </td>
                <td className="px-4 py-2 text-slate-600">{s.specialityLatin ?? "—"}</td>
                <td className="px-4 py-2">
                  {s.printStatus === "PRINTED" ? <span className="text-green-600">Printed</span> : <span className="text-amber-600">Pending</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
