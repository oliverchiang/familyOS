import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { kidId, rewardId } = await req.json();

    if (!kidId || !rewardId) {
      return NextResponse.json({ error: "kidId and rewardId are required" }, { status: 400 });
    }

    // Get kid's total approved points
    const tasks = await prisma.task.findMany({
      where: { kidId, status: "APPROVED" },
    });
    const totalEarned = tasks.reduce((sum, t) => sum + t.points, 0);

    // Get kid's total spent points
    const claims = await prisma.rewardClaim.findMany({
      where: { kidId },
      include: { reward: true },
    });
    const totalSpent = claims.reduce((sum, c) => sum + c.reward.pointsCost, 0);

    const balance = totalEarned - totalSpent;

    // Get reward cost
    const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    if (balance < reward.pointsCost) {
      return NextResponse.json(
        { error: "Not enough points", balance, cost: reward.pointsCost },
        { status: 400 }
      );
    }

    const claim = await prisma.rewardClaim.create({
      data: { kidId, rewardId },
      include: { reward: true },
    });

    return NextResponse.json(claim);
  } catch (error) {
    console.error("POST /api/rewards/claim error:", error);
    return NextResponse.json({ error: "Failed to claim reward" }, { status: 500 });
  }
}
