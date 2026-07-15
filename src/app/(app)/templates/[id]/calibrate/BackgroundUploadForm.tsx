"use client";

import { useActionState, useState } from "react";
import { uploadBackground } from "@/lib/templates";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, type UploadState } from "@/lib/uploadLimits";

const initialState: UploadState = { status: "idle" };

export function BackgroundUploadForm({
  templateId,
  hasBackground,
}: {
  templateId: string;
  hasBackground: boolean;
}) {
  const [state, formAction, pending] = useActionState(uploadBackground, initialState);
  // Files over the Server Action body limit are rejected by Next.js with a 413 before the
  // action runs, so the server cannot report them. Catch that here instead.
  const [tooLarge, setTooLarge] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_UPLOAD_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      setTooLarge(`${file.name} is ${mb} MB — the limit is ${MAX_UPLOAD_MB} MB. Downscale the scan and retry.`);
    } else {
      setTooLarge(null);
    }
  }

  const error = tooLarge ?? (state.status === "error" ? state.message : null);
  const success = !tooLarge && state.status === "ok" ? state.message : null;

  return (
    <form action={formAction} className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="templateId" value={templateId} />
        <label className="text-sm text-slate-600">
          Background scan (PNG/JPG of the blank diploma, oriented landscape):
        </label>
        <input
          type="file"
          name="file"
          accept="image/png,image/jpeg,image/webp"
          required
          onChange={onFileChange}
          className="text-sm"
        />
        <button
          type="submit"
          disabled={pending || !!tooLarge}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
        >
          {pending ? "Uploading…" : "Upload / replace"}
        </button>
        {!hasBackground && !error && !success && (
          <span className="text-sm text-amber-600">No background yet — upload one to calibrate visually.</span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      )}
    </form>
  );
}
