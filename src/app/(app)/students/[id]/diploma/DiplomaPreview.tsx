"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DiplomaSheet, type SheetField } from "@/components/DiplomaSheet";
import { HelpLink } from "@/components/HelpLink";
import { setPrintStatus } from "@/lib/students";

const MM_TO_PX = 96 / 25.4;
const PRINT_FRAME_ID = "diploma-print-frame";

export function DiplomaPreview({
  studentId,
  studentName,
  templateId,
  widthMm,
  heightMm,
  backgroundUrl,
  fields,
  initialStatus,
}: {
  studentId: string;
  studentName: string;
  templateId: string;
  widthMm: number;
  heightMm: number;
  backgroundUrl: string | null;
  fields: SheetField[];
  initialStatus: string;
}) {
  const [showBg, setShowBg] = useState(true);
  const [zoom, setZoom] = useState(0.62);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const [status, setStatus] = useState(initialStatus);
  const [marking, setMarking] = useState(false);
  const [printing, setPrinting] = useState(false);
  const offsetKey = `diploma-offset-${templateId}`;

  // Offset is a property of the physical printer/paper, so remember it per machine.
  useEffect(() => {
    const saved = localStorage.getItem(offsetKey);
    if (saved) {
      try {
        const o = JSON.parse(saved);
        setOffX(Number(o.x) || 0);
        setOffY(Number(o.y) || 0);
      } catch {}
    }
  }, [offsetKey]);
  useEffect(() => {
    localStorage.setItem(offsetKey, JSON.stringify({ x: offX, y: offY }));
  }, [offsetKey, offX, offY]);

  // Print the chrome-free /print/diploma route inside a hidden iframe rather than printing
  // this page. Printing the preview sent the zoom transform to the printer and let the rest
  // of the page — hidden but still taking up space — push the sheet onto later sheets, so
  // the output came out blank across several pages. That route is the same one the PDF
  // export renders, so what prints and what exports cannot drift apart.
  function doPrint(withBg: boolean) {
    setPrinting(true);
    document.getElementById(PRINT_FRAME_ID)?.remove();

    const frame = document.createElement("iframe");
    frame.id = PRINT_FRAME_ID;
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;left:-9999px;top:0;width:0;height:0;border:0";
    frame.src = `/print/diploma/${studentId}?bg=${withBg ? "1" : "0"}&offX=${offX}&offY=${offY}`;

    frame.onload = async () => {
      const w = frame.contentWindow;
      if (!w) {
        setPrinting(false);
        return;
      }
      // Load fires once images are in, but the bundled Arabic font is separate — printing
      // before it resolves would shape the Arabic with a fallback face.
      try {
        await w.document.fonts?.ready;
      } catch {}
      w.focus();
      w.print();
      setPrinting(false);
    };

    document.body.appendChild(frame);
  }

  async function markPrinted() {
    setMarking(true);
    await setPrintStatus(studentId, "PRINTED");
    setStatus("PRINTED");
    setMarking(false);
  }
  async function markPending() {
    setMarking(true);
    await setPrintStatus(studentId, "PENDING");
    setStatus("PENDING");
    setMarking(false);
  }

  const scaledW = widthMm * MM_TO_PX * zoom;
  const scaledH = heightMm * MM_TO_PX * zoom;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-sm">
          <button onClick={() => setZoom((z) => Math.max(0.3, Math.round((z - 0.05) * 100) / 100))} className="rounded border border-slate-300 px-2 py-1">−</button>
          <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(1.5, Math.round((z + 0.05) * 100) / 100))} className="rounded border border-slate-300 px-2 py-1">+</button>
          <label className="ml-2 flex items-center gap-1">
            <input type="checkbox" checked={showBg} onChange={(e) => setShowBg(e.target.checked)} /> Show template
          </label>
        </div>

        <div className="overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-4">
          <div
            className="diploma-scale-wrap relative mx-auto"
            style={{ width: scaledW, height: scaledH }}
          >
            <div
              className="diploma-scale-inner"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}
            >
              <div className={`diploma-print-root ${showBg ? "" : "hide-bg-screen"}`} style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.15)" }}>
                <DiplomaSheet
                  id="diploma-print"
                  widthMm={widthMm}
                  heightMm={heightMm}
                  backgroundUrl={backgroundUrl}
                  showBackground={true}
                  fields={fields}
                  offsetXMm={offX}
                  offsetYMm={offY}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="font-medium text-slate-900">{studentName}</div>
          <div className="mt-1">
            Status:{" "}
            {status === "PRINTED" ? <span className="text-green-600">Printed</span> : <span className="text-amber-600">Pending</span>}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="mb-2 font-semibold text-slate-700">Alignment offset (mm)</h3>
          <p className="mb-2 text-xs text-slate-500">
            Nudge all fields to match your printer. Saved for this computer.{" "}
            <HelpLink anchor="print-single" className="whitespace-nowrap underline" />
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block text-xs text-slate-500">Offset X</span>
              <input type="number" step={0.5} value={offX} onChange={(e) => setOffX(Number(e.target.value) || 0)} className="w-full rounded border border-slate-300 px-2 py-1" />
            </label>
            <label className="block">
              <span className="block text-xs text-slate-500">Offset Y</span>
              <input type="number" step={0.5} value={offY} onChange={(e) => setOffY(Number(e.target.value) || 0)} className="w-full rounded border border-slate-300 px-2 py-1" />
            </label>
          </div>
          <div className="mt-2 flex items-center justify-center gap-1">
            <button onClick={() => setOffX((v) => Math.round((v - 0.5) * 10) / 10)} className="rounded border px-2">←</button>
            <button onClick={() => setOffY((v) => Math.round((v - 0.5) * 10) / 10)} className="rounded border px-2">↑</button>
            <button onClick={() => setOffY((v) => Math.round((v + 0.5) * 10) / 10)} className="rounded border px-2">↓</button>
            <button onClick={() => setOffX((v) => Math.round((v + 0.5) * 10) / 10)} className="rounded border px-2">→</button>
            <button onClick={() => { setOffX(0); setOffY(0); }} className="ml-2 rounded border px-2 text-xs">Reset</button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="mb-2 font-semibold text-slate-700">Print</h3>
          <button
            onClick={() => doPrint(false)}
            disabled={printing}
            className="mb-2 w-full rounded bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {printing ? "Preparing…" : "🖨 Print onto diploma (data only)"}
          </button>
          <button
            onClick={() => doPrint(true)}
            disabled={printing}
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            🧪 Test print (with background)
          </button>
          <button
            onClick={() => window.open(`/api/diploma/${studentId}/pdf?bg=1&offX=${offX}&offY=${offY}`, "_blank", "noopener")}
            className="mt-2 block w-full rounded border border-slate-300 px-3 py-2 text-center text-slate-700 hover:bg-slate-100"
          >
            ⬇ Export PDF (complete diploma)
          </button>
          <p className="mt-2 text-xs text-amber-700">
            In the print dialog choose <b>Actual size / 100%</b> (not “Fit to page”), and margins <b>None</b>.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          {status === "PRINTED" ? (
            <button onClick={markPending} disabled={marking} className="w-full rounded border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100">
              Mark as pending
            </button>
          ) : (
            <button onClick={markPrinted} disabled={marking} className="w-full rounded bg-green-600 px-3 py-2 font-medium text-white hover:bg-green-700">
              ✓ Mark as printed
            </button>
          )}
          <Link href={`/students/${studentId}/edit`} className="mt-2 block text-center text-slate-500 hover:text-slate-700">
            Edit student data
          </Link>
        </div>
      </div>
    </div>
  );
}
