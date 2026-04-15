import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const task = await prisma.task.update({
    where: { id },
    data: body,
    include: { video: true },
  });

  return NextResponse.json(task);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.video.deleteMany({ where: { taskId: id } });
  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
