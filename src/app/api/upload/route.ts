import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("video") as File | null;
    const taskId = formData.get("taskId") as string | null;

    if (!file || !taskId) {
      return NextResponse.json(
        { error: "Missing video or taskId" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Video too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    // Verify task exists
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Determine file extension from mime type
    const ext = file.type.includes("mp4") ? "mp4" : "webm";
    const filename = `videos/${taskId}-${Date.now()}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });

    // Upsert video record
    await prisma.video.upsert({
      where: { taskId },
      create: { taskId, filePath: blob.url },
      update: { filePath: blob.url },
    });

    // Mark task as done
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "DONE" },
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
