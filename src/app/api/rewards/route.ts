import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const rewards = await prisma.reward.findMany({
    orderBy: { pointsCost: "asc" },
  });
  return NextResponse.json(rewards);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, emoji, pointsCost } = body;

  const reward = await prisma.reward.create({
    data: { title, emoji: emoji || "🎁", pointsCost },
  });

  return NextResponse.json(reward);
}
