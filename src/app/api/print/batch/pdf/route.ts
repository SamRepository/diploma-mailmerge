import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { renderManyDiplomasPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const bodySchema = z.object({
  ids: z.array(z.string()).min(1).max(500),
  bg: z.boolean().optional(),
  offX: z.number().optional(),
  offY: z.number().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response("Bad request", { status: 400 });

  const { ids, bg = false, offX = 0, offY = 0 } = parsed.data;
  const origin = new URL(req.url).origin;
  const cookie = req.headers.get("cookie") ?? "";

  // Keep only existing ids, preserving order.
  const existing = await prisma.student.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const existingSet = new Set(existing.map((s) => s.id));
  const orderedIds = ids.filter((id) => existingSet.has(id));
  if (orderedIds.length === 0) return new Response("No valid students", { status: 400 });

  const pdf = await renderManyDiplomasPdf(origin, cookie, orderedIds, { bg, offX, offY });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "PDF_BATCH_EXPORT", detail: `count=${orderedIds.length}`, offsetX: offX, offsetY: offY },
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="diplomas-batch-${orderedIds.length}.pdf"`,
    },
  });
}
