// Client-safe upload constants. Kept out of lib/uploads.ts because that module imports
// node:fs / node:path and must never reach the browser bundle.

// Keep in sync with experimental.serverActions.bodySizeLimit in next.config.mjs. Anything
// larger is rejected by Next.js with a 413 before the action runs, so the server can never
// report on it — the form checks this in the browser before submitting.
export const MAX_UPLOAD_MB = 25;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export type UploadState = { status: "idle" | "ok" | "error"; message?: string };
