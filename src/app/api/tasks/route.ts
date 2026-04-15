import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const kidId = req.nextUrl.searchParams.get("kidId");
  const date = req.nextUrl.searchParams.get("date");

  const tasks = await prisma.task.findMany({
    where: {
      ...(kidId ? { kidId } : {}),
      ...(date ? { date } : {}),
    },
    include: { video: true, kid: true },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { kidId, title, emoji, durationMins, date } = body;

  const targetDate = date || new Date().toISOString().split("T")[0];

  const count = await prisma.task.count({
    where: { kidId, date: targetDate },
  });

  const task = await prisma.task.create({
    data: {
      kidId,
      title,
      emoji: emoji || "✅",
      durationMins: durationMins || 15,
      date: targetDate,
      order: count,
      points: durationMins || 15,
    },
  });

  return NextResponse.json(task);
}
