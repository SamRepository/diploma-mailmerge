import "server-only";
import QRCode from "qrcode";
import type { SheetField } from "@/components/DiplomaSheet";

// Replace the text value of any `qr` field with a QR-code data URL. Kept separate from
// lib/diploma.ts so the `qrcode` (Node) dependency never reaches a client bundle.
export async function withQrCodes(fields: SheetField[]): Promise<SheetField[]> {
  return Promise.all(
    fields.map(async (f) => {
      if (f.kind !== "qr" || !f.value) return f;
      // The QR carries the whole diploma summary, so it needs far more modules than a bare
      // registration number did. Render it large and downscale via CSS (width is set in mm
      // by the field), or the printed modules blur at ~22 mm. Error correction stays at M:
      // the payload is long, and H would push the module count up and each module smaller.
      const dataUrl = await QRCode.toDataURL(f.value, {
        margin: 0,
        errorCorrectionLevel: "M",
        width: 1024,
      });
      return { ...f, value: dataUrl };
    }),
  );
}
