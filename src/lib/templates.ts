"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { ensureUploadsDir, uploadPath, IMAGE_CONTENT_TYPES } from "@/lib/uploads";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, type UploadState } from "@/lib/uploadLimits";

export async function uploadBackground(_prev: UploadState, formData: FormData): Promise<UploadState> {
  await requireAdmin();
  const templateId = String(formData.get("templateId"));
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose an image file first." };
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!IMAGE_CONTENT_TYPES[ext]) {
    const allowed = Object.keys(IMAGE_CONTENT_TYPES).join(", ");
    return { status: "error", message: `${file.name} is not a supported image (allowed: ${allowed}).` };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return { status: "error", message: `${file.name} is ${mb} MB — the limit is ${MAX_UPLOAD_MB} MB.` };
  }

  const name = `template-${templateId}${ext}`;
  try {
    await ensureUploadsDir();
    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(uploadPath(name), bytes);
  } catch (err) {
    // Most likely the uploads volume is missing or read-only in the deployment.
    console.error("uploadBackground: writing the scan failed", err);
    return { status: "error", message: "Could not save the file on the server. Check the uploads volume." };
  }

  await prisma.template.update({ where: { id: templateId }, data: { backgroundImagePath: name } });
  revalidatePath(`/templates/${templateId}/calibrate`);
  revalidatePath("/templates");

  const mb = (file.size / 1024 / 1024).toFixed(1);
  return { status: "ok", message: `Uploaded ${file.name} (${mb} MB).` };
}

// Remove / restore a field on a template.
//
// This flips a `removed` flag rather than deleting the row. The container runs the
// idempotent seed on every start (docker-entrypoint.sh), which upserts the standard field
// set — a deleted row would be re-created on the next restart or redeploy, undoing the
// admin's decision. Keeping the row lets the seed's upsert find it and leave it alone.
export async function setFieldRemoved(
  templateId: string,
  fieldId: string,
  removed: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const field = await prisma.fieldDefinition.findUnique({ where: { id: fieldId } });
  if (!field || field.templateId !== templateId) {
    return { ok: false, error: "That field no longer exists." };
  }

  await prisma.fieldDefinition.update({ where: { id: fieldId }, data: { removed } });
  revalidatePath(`/templates/${templateId}/calibrate`);
  revalidatePath("/templates");
  return { ok: true };
}

const fieldUpdateSchema = z.object({
  id: z.string(),
  xMm: z.number(),
  yMm: z.number(),
  widthMm: z.number(),
  fontSize: z.number(),
  align: z.enum(["left", "center", "right"]),
  direction: z.enum(["ltr", "rtl"]),
  fontFamily: z.string(),
  printable: z.boolean(),
  fixedValue: z.string().nullable(),
});

export async function saveFieldPositions(templateId: string, updates: unknown): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const parsed = z.array(fieldUpdateSchema).safeParse(updates);
  if (!parsed.success) return { ok: false, error: "Invalid field data" };

  await prisma.$transaction(
    parsed.data.map((f) =>
      prisma.fieldDefinition.update({
        where: { id: f.id },
        data: {
          xMm: f.xMm,
          yMm: f.yMm,
          widthMm: f.widthMm,
          fontSize: f.fontSize,
          align: f.align,
          direction: f.direction,
          fontFamily: f.fontFamily,
          printable: f.printable,
          fixedValue: f.fixedValue,
        },
      }),
    ),
  );

  revalidatePath(`/templates/${templateId}/calibrate`);
  return { ok: true };
}
