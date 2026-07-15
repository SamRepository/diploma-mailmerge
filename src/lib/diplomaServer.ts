import "server-only";
import QRCode from "qrcode";
import type { SheetField } from "@/components/DiplomaSheet";

// Replace the text value of any `qr` field with a QR-code data URL. Kept separate from
// lib/diploma.ts so the `qrcode` (Node) dependency never reaches a client bundle.
export async function withQrCodes(fields: SheetField[]): Promise<SheetField[]> {
  return Promise.all(
    fields.map(async (f) => {
      if (f.kind !== "qr" || !f.value) return f;
      const dataUrl = await QRCode.toDataURL(f.value, { margin: 0, errorCorrectionLevel: "M" });
      return { ...f, value: dataUrl };
    }),
  );
}
