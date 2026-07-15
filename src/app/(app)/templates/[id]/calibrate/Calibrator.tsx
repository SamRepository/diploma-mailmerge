"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { saveFieldPositions, setFieldRemoved } from "@/lib/templates";

const PT_TO_MM = 25.4 / 72;

export type CalibratorField = {
  id: string;
  key: string;
  label: string;
  source: string | null;
  lang: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  fontSize: number;
  fontFamily: string;
  align: "left" | "center" | "right";
  direction: "ltr" | "rtl";
  printable: boolean;
  fixedValue: string | null;
  sampleValue: string;
};

export function Calibrator({
  templateId,
  pageWidthMm,
  pageHeightMm,
  backgroundUrl,
  initialFields,
  initialRemovedFields = [],
}: {
  templateId: string;
  pageWidthMm: number;
  pageHeightMm: number;
  backgroundUrl: string | null;
  initialFields: CalibratorField[];
  initialRemovedFields?: CalibratorField[];
}) {
  const [fields, setFields] = useState<CalibratorField[]>(initialFields);
  const [removedFields, setRemovedFields] = useState<CalibratorField[]>(initialRemovedFields);
  const [selectedId, setSelectedId] = useState<string | null>(initialFields[0]?.id ?? null);
  const [zoom, setZoom] = useState(1);
  const [showBg, setShowBg] = useState(true);
  const [onlyPrintable, setOnlyPrintable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: string; startX: number; startY: number; origXMm: number; origYMm: number } | null>(null);

  const basePxPerMm = 940 / pageWidthMm;
  const scale = basePxPerMm * zoom; // px per mm

  const selected = fields.find((f) => f.id === selectedId) ?? null;

  const updateField = useCallback((id: string, patch: Partial<CalibratorField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    setSaved(false);
  }, []);

  function onPointerDown(e: React.PointerEvent, f: CalibratorField) {
    e.preventDefault();
    setSelectedId(f.id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { id: f.id, startX: e.clientX, startY: e.clientY, origXMm: f.xMm, origYMm: f.yMm };
  }

  function onPointerMove(e: React.PointerEvent) {
    const ds = dragState.current;
    if (!ds) return;
    const dxMm = (e.clientX - ds.startX) / scale;
    const dyMm = (e.clientY - ds.startY) / scale;
    const nx = Math.max(0, Math.min(pageWidthMm, ds.origXMm + dxMm));
    const ny = Math.max(0, Math.min(pageHeightMm, ds.origYMm + dyMm));
    updateField(ds.id, { xMm: round1(nx), yMm: round1(ny) });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (dragState.current) {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      dragState.current = null;
    }
  }

  function nudge(dx: number, dy: number) {
    if (!selected) return;
    updateField(selected.id, {
      xMm: round1(Math.max(0, Math.min(pageWidthMm, selected.xMm + dx))),
      yMm: round1(Math.max(0, Math.min(pageHeightMm, selected.yMm + dy))),
    });
  }

  const removeSelected = useCallback(async () => {
    const target = fields.find((f) => f.id === selectedId);
    if (!target) return;
    if (!window.confirm(`Remove the field “${target.label}” from this template?\n\nIt stops rendering and printing straight away, and stays removed across restarts. You can put it back from “Removed fields”.`)) {
      return;
    }

    setDeleteError(null);
    const res = await setFieldRemoved(templateId, target.id, true);
    if (!res.ok) {
      setDeleteError(res.error ?? "Could not remove that field.");
      return;
    }
    setFields((prev) => {
      const next = prev.filter((f) => f.id !== target.id);
      setSelectedId(next[0]?.id ?? null);
      return next;
    });
    setRemovedFields((prev) => [...prev, target]);
  }, [fields, selectedId, templateId]);

  const restoreField = useCallback(
    async (target: CalibratorField) => {
      setDeleteError(null);
      const res = await setFieldRemoved(templateId, target.id, false);
      if (!res.ok) {
        setDeleteError(res.error ?? "Could not restore that field.");
        return;
      }
      setRemovedFields((prev) => prev.filter((f) => f.id !== target.id));
      setFields((prev) => [...prev, target]);
      setSelectedId(target.id);
    },
    [templateId],
  );

  // Del / Backspace removes the selected field. Ignored while a form control has focus,
  // so editing the fixed-value or a number input never deletes the field being edited.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const el = document.activeElement;
      const tag = el?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || (el as HTMLElement | null)?.isContentEditable) {
        return;
      }
      if (!selectedId) return;
      e.preventDefault();
      void removeSelected();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId, removeSelected]);

  async function onSave() {
    setSaving(true);
    setSaved(false);
    const payload = fields.map((f) => ({
      id: f.id,
      xMm: round1(f.xMm),
      yMm: round1(f.yMm),
      widthMm: round1(f.widthMm),
      fontSize: f.fontSize,
      align: f.align,
      direction: f.direction,
      fontFamily: f.fontFamily,
      printable: f.printable,
      fixedValue: f.fixedValue,
    }));
    const res = await saveFieldPositions(templateId, payload);
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  const visibleFields = onlyPrintable ? fields.filter((f) => f.printable) : fields;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      {/* Canvas */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-sm">
          <button onClick={onSave} disabled={saving} className="rounded bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {saving ? "Saving…" : "Save positions"}
          </button>
          {saved && <span className="text-green-600">Saved ✓</span>}
          <span className="mx-2 h-4 w-px bg-slate-200" />
          <button onClick={() => setZoom((z) => Math.max(0.4, round2(z - 0.1)))} className="rounded border border-slate-300 px-2 py-1">−</button>
          <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2.5, round2(z + 0.1)))} className="rounded border border-slate-300 px-2 py-1">+</button>
          <span className="mx-2 h-4 w-px bg-slate-200" />
          <label className="flex items-center gap-1"><input type="checkbox" checked={showBg} onChange={(e) => setShowBg(e.target.checked)} /> Background</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={onlyPrintable} onChange={(e) => setOnlyPrintable(e.target.checked)} /> Printable only</label>
        </div>

        <div className="overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-4">
          <div
            ref={sheetRef}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="relative mx-auto bg-white shadow"
            style={{ width: pageWidthMm * scale, height: pageHeightMm * scale, touchAction: "none" }}
          >
            {backgroundUrl && showBg && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={backgroundUrl} alt="template" className="pointer-events-none absolute inset-0 h-full w-full select-none" />
            )}
            {visibleFields.map((f) => {
              const isSel = f.id === selectedId;
              const text = f.sampleValue || f.label;
              return (
                <div
                  key={f.id}
                  onPointerDown={(e) => onPointerDown(e, f)}
                  className={`absolute cursor-move overflow-hidden whitespace-nowrap ${
                    isSel ? "ring-2 ring-indigo-500" : "ring-1 ring-slate-300/60"
                  } ${f.printable ? "" : "opacity-50"}`}
                  style={{
                    left: f.xMm * scale,
                    top: f.yMm * scale,
                    width: f.widthMm * scale,
                    fontSize: f.fontSize * PT_TO_MM * scale,
                    fontFamily: f.fontFamily === "arabic" ? "var(--font-arabic)" : "Georgia, serif",
                    direction: f.direction,
                    textAlign: f.align,
                    lineHeight: 1.1,
                    backgroundColor: isSel ? "rgba(99,102,241,0.10)" : "rgba(0,0,0,0.02)",
                  }}
                  title={f.label}
                >
                  {text}
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Drag a field to position it. Press <kbd className="rounded border border-slate-300 bg-slate-50 px-1">Del</kbd> to
          remove the selected field — removal applies immediately and survives restarts; restore it from “Removed
          fields”. Boxes at 50% opacity are marked non-printable (pre-printed on the paper).
          Sample text is from the first imported student.
        </p>
        {deleteError && (
          <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {deleteError}
          </p>
        )}
      </div>

      {/* Property panel */}
      <div className="space-y-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Fields</h3>
          <div className="max-h-56 space-y-1 overflow-auto">
            {fields.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                className={`block w-full truncate rounded px-2 py-1 text-left text-sm ${
                  f.id === selectedId ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50 text-slate-600"
                }`}
              >
                {f.printable ? "" : "◌ "}{f.label}
              </button>
            ))}
          </div>
        </div>

        {removedFields.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <h3 className="mb-1 text-sm font-semibold text-slate-700">Removed fields</h3>
            <p className="mb-2 text-xs text-slate-500">
              Not rendered and not printed. They stay removed across restarts and re-seeds.
            </p>
            <div className="max-h-40 space-y-1 overflow-auto">
              {removedFields.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-2 rounded px-2 py-1 text-sm text-slate-500">
                  <span className="truncate line-through">{f.label}</span>
                  <button
                    type="button"
                    onClick={() => void restoreField(f)}
                    className="shrink-0 rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <h3 className="mb-2 font-semibold text-slate-700">{selected.label}</h3>

            <div className="grid grid-cols-2 gap-2">
              <NumberField label="X (mm)" value={selected.xMm} onChange={(v) => updateField(selected.id, { xMm: v })} />
              <NumberField label="Y (mm)" value={selected.yMm} onChange={(v) => updateField(selected.id, { yMm: v })} />
              <NumberField label="Width (mm)" value={selected.widthMm} onChange={(v) => updateField(selected.id, { widthMm: v })} />
              <NumberField label="Font (pt)" value={selected.fontSize} onChange={(v) => updateField(selected.id, { fontSize: v })} />
            </div>

            <div className="mt-2 flex items-center justify-center gap-1">
              <span className="mr-2 text-xs text-slate-500">Nudge:</span>
              <button onClick={() => nudge(-0.5, 0)} className="rounded border px-2">←</button>
              <button onClick={() => nudge(0, -0.5)} className="rounded border px-2">↑</button>
              <button onClick={() => nudge(0, 0.5)} className="rounded border px-2">↓</button>
              <button onClick={() => nudge(0.5, 0)} className="rounded border px-2">→</button>
            </div>

            <label className="mt-3 block text-xs text-slate-500">Alignment</label>
            <select value={selected.align} onChange={(e) => updateField(selected.id, { align: e.target.value as CalibratorField["align"] })} className="w-full rounded border border-slate-300 px-2 py-1">
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>

            <label className="mt-2 block text-xs text-slate-500">Direction</label>
            <select value={selected.direction} onChange={(e) => updateField(selected.id, { direction: e.target.value as CalibratorField["direction"] })} className="w-full rounded border border-slate-300 px-2 py-1">
              <option value="ltr">Left-to-right</option>
              <option value="rtl">Right-to-left (Arabic)</option>
            </select>

            <label className="mt-2 block text-xs text-slate-500">Font</label>
            <select value={selected.fontFamily} onChange={(e) => updateField(selected.id, { fontFamily: e.target.value })} className="w-full rounded border border-slate-300 px-2 py-1">
              <option value="serif">Serif (Latin)</option>
              <option value="arabic">Arabic</option>
            </select>

            <label className="mt-2 block text-xs text-slate-500">Fixed value (overrides student data)</label>
            <input
              value={selected.fixedValue ?? ""}
              onChange={(e) => updateField(selected.id, { fixedValue: e.target.value || null })}
              placeholder="e.g. Doctorat"
              className="w-full rounded border border-slate-300 px-2 py-1"
            />

            <label className="mt-3 flex items-center gap-2">
              <input type="checkbox" checked={selected.printable} onChange={(e) => updateField(selected.id, { printable: e.target.checked })} />
              <span>Printable (uncheck if pre-printed on the paper)</span>
            </label>

            <button
              type="button"
              onClick={() => void removeSelected()}
              className="mt-3 w-full rounded border border-red-300 px-2 py-1 text-sm text-red-700 hover:bg-red-50"
            >
              Remove field (Del)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-500">{label}</span>
      <input
        type="number"
        step={0.5}
        value={value}
        onChange={(e) => onChange(round1(parseFloat(e.target.value) || 0))}
        className="w-full rounded border border-slate-300 px-2 py-1"
      />
    </label>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
