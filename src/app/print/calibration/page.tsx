import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PrintButton } from "@/components/PrintButton";

// A4-landscape millimetre grid. Print at 100% on plain paper and overlay a real diploma
// to read off the offset needed for alignment. Verify the printed square is 50 mm.
export default async function CalibrationGridPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const W = 297;
  const H = 210;
  const verticals = Array.from({ length: W / 10 + 1 }, (_, i) => i * 10);
  const horizontals = Array.from({ length: H / 10 + 1 }, (_, i) => i * 10);

  return (
    <div>
      <div className="p-4 print:hidden">
        <h1 className="text-lg font-semibold text-slate-900">Calibration grid</h1>
        <p className="mt-1 max-w-xl text-sm text-slate-600">
          Print this at <b>Actual size / 100%</b> (margins <b>None</b>) on plain A4. Measure a major square — it must be
          exactly <b>50&nbsp;mm</b>. Then lay a real diploma over the print to read the X/Y offset, and enter it on the
          diploma screen.
        </p>
        <div className="mt-3">
          <PrintButton label="Print grid" />
        </div>
      </div>

      <div className="diploma-print-root with-bg">
        <div className="diploma-sheet" style={{ position: "relative", width: `${W}mm`, height: `${H}mm`, background: "#fff" }}>
          <svg width={`${W}mm`} height={`${H}mm`} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
            {verticals.map((x) => (
              <line key={`v${x}`} x1={x} y1={0} x2={x} y2={H} stroke="#94a3b8" strokeWidth={x % 50 === 0 ? 0.3 : 0.1} />
            ))}
            {horizontals.map((y) => (
              <line key={`h${y}`} x1={0} y1={y} x2={W} y2={y} stroke="#94a3b8" strokeWidth={y % 50 === 0 ? 0.3 : 0.1} />
            ))}
            {verticals.filter((x) => x % 50 === 0).map((x) => (
              <text key={`vt${x}`} x={x + 0.6} y={4} fontSize={3} fill="#334155">{x}</text>
            ))}
            {horizontals.filter((y) => y % 50 === 0 && y > 0).map((y) => (
              <text key={`ht${y}`} x={0.6} y={y - 0.8} fontSize={3} fill="#334155">{y}</text>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
