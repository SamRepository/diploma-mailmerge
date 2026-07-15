import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { renderDiplomaPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const url = new URL(req.url);
  const origin = url.origin;
  const bg = url.searchParams.get("bg") === "1";
  const offX = Number(url.searchParams.get("offX")) || 0;
  const offY = Number(url.searchParams.get("offY")) || 0;
  const cookie = req.headers.get("cookie") ?? "";

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return new Response("Not found", { status: 404 });

  const pdf = await renderDiplomaPdf(origin, cookie, id, { bg, offX, offY });

  await prisma.auditLog.create({
    data: { userId: session.user.id, studentId: id, action: "PDF_EXPORT" },
  });

  const safeName = student.nameLatin.replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "diploma";
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="diploma-${safeName}.pdf"`,
    },
  });
}
