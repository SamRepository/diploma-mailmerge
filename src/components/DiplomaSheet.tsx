// Presentational diploma renderer — the SINGLE layout used for screen preview,
// browser print, and headless-Chromium PDF export. Positions use real CSS mm/pt units
// so the browser prints at exact physical size on the pre-printed A4 paper.
//
// No hooks here on purpose: it must render identically on server and client.

export type SheetField = {
  id: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  fontSize: number; // points
  fontFamily: string; // "arabic" | "serif"
  align: "left" | "center" | "right";
  direction: "ltr" | "rtl";
  kind?: "text" | "qr"; // qr → `value` is an image data URL rendered as a widthMm square
  value: string;
};

const LATIN_STACK = `"Times New Roman", Georgia, serif`;
const ARABIC_STACK = `"Amiri", "Noto Naskh Arabic", serif`;

export function DiplomaSheet({
  id = "diploma-sheet",
  widthMm,
  heightMm,
  backgroundUrl,
  showBackground,
  fields,
  offsetXMm = 0,
  offsetYMm = 0,
}: {
  id?: string;
  widthMm: number;
  heightMm: number;
  backgroundUrl: string | null;
  showBackground: boolean;
  fields: SheetField[];
  offsetXMm?: number;
  offsetYMm?: number;
}) {
  return (
    <div
      id={id}
      className="diploma-sheet"
      style={{
        position: "relative",
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        overflow: "hidden",
        background: "white",
      }}
    >
      {showBackground && backgroundUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="diploma-bg"
          src={backgroundUrl}
          alt=""
          style={{ position: "absolute", inset: 0, width: `${widthMm}mm`, height: `${heightMm}mm` }}
        />
      )}

      <div style={{ position: "absolute", inset: 0, transform: `translate(${offsetXMm}mm, ${offsetYMm}mm)` }}>
        {fields.map((f) =>
          f.kind === "qr" ? (
            f.value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={f.id}
                src={f.value}
                alt=""
                style={{ position: "absolute", left: `${f.xMm}mm`, top: `${f.yMm}mm`, width: `${f.widthMm}mm`, height: `${f.widthMm}mm` }}
              />
            ) : null
          ) : (
            <div
              key={f.id}
              style={{
                position: "absolute",
                left: `${f.xMm}mm`,
                top: `${f.yMm}mm`,
                width: `${f.widthMm}mm`,
                fontSize: `${f.fontSize}pt`,
                fontFamily: f.fontFamily === "arabic" ? ARABIC_STACK : LATIN_STACK,
                direction: f.direction,
                textAlign: f.align,
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                color: "#111",
              }}
            >
              {f.value}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
