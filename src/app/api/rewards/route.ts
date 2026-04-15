import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const rewards = await prisma.reward.findMany({
      orderBy: { pointsCost: "asc" },
    });
    return NextResponse.json(rewards);
  } catch (error) {
    console.error("GET /api/rewards error:", error);
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, emoji, pointsCost } = body;

    if (!title || !pointsCost) {
      return NextResponse.json({ error: "title and pointsCost are required" }, { status: 400 });
    }

    const reward = await prisma.reward.create({
      data: { title, emoji: emoji || "🎁", pointsCost },
    });

    return NextResponse.json(reward);
  } catch (error) {
    console.error("POST /api/rewards error:", error);
    return NextResponse.json({ error: "Failed to create reward" }, { status: 500 });
  }
}
