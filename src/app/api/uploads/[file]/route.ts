import path from "node:path";
import fs from "node:fs/promises";
import { auth } from "@/auth";
import { uploadPath, IMAGE_CONTENT_TYPES } from "@/lib/uploads";

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { file } = await params;
  const ext = path.extname(file).toLowerCase();
  const contentType = IMAGE_CONTENT_TYPES[ext];
  if (!contentType) return new Response("Unsupported", { status: 415 });

  try {
    const buf = await fs.readFile(uploadPath(file));
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=60" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
