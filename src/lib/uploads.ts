import path from "node:path";
import fs from "node:fs/promises";

// Uploaded template backgrounds live outside the repo, on a persistent volume in
// production (UPLOADS_DIR=/data/uploads). They are served through /api/uploads/[file].
export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

export async function ensureUploadsDir(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export function uploadPath(name: string): string {
  // Prevent path traversal — only use the base name.
  return path.join(UPLOADS_DIR, path.basename(name));
}

export const IMAGE_CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};
