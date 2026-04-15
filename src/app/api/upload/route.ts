import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("video") as File;
  const taskId = formData.get("taskId") as string;

  if (!file || !taskId) {
    return NextResponse.json({ error: "Missing video or taskId" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "videos");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${taskId}-${Date.now()}.webm`;
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  const publicPath = `/uploads/videos/${filename}`;

  // Upsert video record
  await prisma.video.upsert({
    where: { taskId },
    create: { taskId, filePath: publicPath },
    update: { filePath: publicPath },
  });

  // Mark task as done
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "DONE" },
  });

  return NextResponse.json({ path: publicPath });
}
