"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { ensureUploadsDir, uploadPath, IMAGE_CONTENT_TYPES } from "@/lib/uploads";

export async function uploadBackground(formData: FormData): Promise<void> {
  await requireAdmin();
  const templateId = String(formData.get("templateId"));
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const ext = path.extname(file.name).toLowerCase();
  if (!IMAGE_CONTENT_TYPES[ext]) return; // only images

  await ensureUploadsDir();
  const name = `template-${templateId}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(uploadPath(name), bytes);

  await prisma.template.update({ where: { id: templateId }, data: { backgroundImagePath: name } });
  revalidatePath(`/templates/${templateId}/calibrate`);
  revalidatePath("/templates");
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
