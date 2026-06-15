"use server";

import { revalidatePath } from "next/cache";
import { syncAwards } from "@/lib/db/awards";
import { canRedeem, weekBalanceMins } from "@/lib/economy";
import { prisma } from "@/lib/prisma";
import { weekStartISO } from "@/lib/week";

// NOTE: single-family, no-auth prototype. These mutations are intentionally
// unauthenticated for now; parent-PIN gating arrives with the parent dashboard.

/** Kid logs progress on a task. Counts immediately (interim) and may earn minutes. */
export async function logCompletion(taskId: string): Promise<void> {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error(`Unknown task: ${taskId}`);

  const weekStart = weekStartISO(new Date());

  await prisma.completion.create({
    data: { taskId: task.id, kidId: task.kidId, weekStart, approved: true },
  });

  await syncAwards(task.kidId, weekStart);
  revalidatePath("/");
}

/** Parent approves a pending completion (for the future approval queue). */
export async function approveCompletion(completionId: string): Promise<void> {
  const completion = await prisma.completion.update({
    where: { id: completionId },
    data: { approved: true },
  });

  await syncAwards(completion.kidId, completion.weekStart);
  revalidatePath("/");
}

/** Kid redeems screen-time minutes. Never goes below zero. */
export async function redeemMinutes(
  kidId: string,
  amountMins: number,
): Promise<{ ok: boolean; reason?: string }> {
  const weekStart = weekStartISO(new Date());

  const entries = await prisma.ledgerEntry.findMany({
    where: { kidId, weekStart },
    select: { minutes: true },
  });
  const balance = weekBalanceMins(entries);

  if (!canRedeem(balance, amountMins)) {
    return { ok: false, reason: "Not enough minutes" };
  }

  await prisma.ledgerEntry.create({
    data: {
      kidId,
      weekStart,
      type: "REDEEM",
      minutes: -amountMins,
      note: "Screen time used",
    },
  });

  revalidatePath("/");
  return { ok: true };
}
