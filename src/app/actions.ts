"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { syncAwards } from "@/lib/db/awards";
import { computeLeft, gainedFromTasks, tokenBalance } from "@/lib/economy";
import { prisma } from "@/lib/prisma";
import { weekStartISO } from "@/lib/week";

// Single-family, no-account prototype. The parent PIN gates parent-only
// mutations server-side (not just the /parent page) so kids can't self-approve
// by POSTing to the action directly.

const PARENT_COOKIE = "parent_unlocked";

/** Whether the parent view is unlocked this session. */
export async function isParentUnlocked(): Promise<boolean> {
  return (await cookies()).get(PARENT_COOKIE)?.value === "1";
}

async function requireParent(): Promise<void> {
  if (!(await isParentUnlocked())) {
    throw new Error("Parent PIN required");
  }
}

function revalidateAll(kidId?: string) {
  revalidatePath("/");
  revalidatePath("/parent");
  if (kidId) revalidatePath(`/kid/${kidId}`);
}

/**
 * Kid logs a task — creates a PENDING completion (awaits parent approval).
 * Records against the week being viewed (snapped to its Monday) so future
 * weeks can be logged ahead; defaults to the current week.
 */
export async function logCompletion(taskId: string, weekStart?: string): Promise<void> {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error(`Unknown task: ${taskId}`);

  const ws =
    weekStart && /^\d{4}-\d{2}-\d{2}$/.test(weekStart)
      ? weekStartISO(new Date(`${weekStart}T12:00:00Z`))
      : weekStartISO(new Date());

  await prisma.completion.create({
    data: { taskId: task.id, kidId: task.kidId, weekStart: ws, status: "PENDING" },
  });
  revalidateAll(task.kidId);
}

/** Parent approves one pending completion; may cross a target and award minutes. */
export async function approveCompletion(completionId: string): Promise<void> {
  await requireParent();
  const completion = await prisma.completion.findUnique({ where: { id: completionId } });
  if (!completion || completion.status !== "PENDING") return;

  await prisma.completion.update({
    where: { id: completionId },
    data: { status: "APPROVED", approvedAt: new Date() },
  });

  // Awards the reward once if this crossed the weekly target (celebration unseen).
  await syncAwards(completion.kidId, completion.weekStart, { celebrated: false });
  revalidateAll(completion.kidId);
}

/** Parent rejects one pending completion (discarded). */
export async function rejectCompletion(completionId: string): Promise<void> {
  await requireParent();
  const completion = await prisma.completion.findUnique({ where: { id: completionId } });
  if (!completion || completion.status !== "PENDING") return;

  await prisma.completion.update({
    where: { id: completionId },
    data: { status: "REJECTED" },
  });
  revalidateAll(completion.kidId);
}

/**
 * Kid redeems screen time. Recomputes the balance and inserts the REDEEM inside
 * one transaction so concurrent redeems can't overspend below zero.
 */
export async function redeemMinutes(
  kidId: string,
  amountMins: number,
): Promise<{ ok: boolean; used: number }> {
  const weekStart = weekStartISO(new Date());

  const result = await prisma.$transaction(async (tx) => {
    const [tasks, approvedCounts, ledger] = await Promise.all([
      tx.task.findMany({
        where: { kidId, active: true },
        select: { id: true, targetCount: true, rewardMins: true },
      }),
      tx.completion.groupBy({
        by: ["taskId"],
        where: { kidId, weekStart, status: "APPROVED" },
        _count: { _all: true },
      }),
      tx.ledgerEntry.findMany({ where: { kidId, weekStart }, select: { type: true, minutes: true } }),
    ]);

    const countByTask = new Map(approvedCounts.map((c) => [c.taskId, c._count._all]));
    const gained = gainedFromTasks(
      tasks.map((t) => ({
        approved: countByTask.get(t.id) ?? 0,
        target: t.targetCount,
        reward: t.rewardMins,
      })),
    );
    let redeemed = 0;
    let adjust = 0;
    for (const l of ledger) {
      if (l.type === "REDEEM") redeemed += Math.abs(l.minutes);
      else if (l.type === "ADJUST") adjust += l.minutes;
    }

    const left = computeLeft(gained, redeemed, adjust);
    const take = Math.min(amountMins, left);
    if (take <= 0) return { ok: false, used: 0 };

    await tx.ledgerEntry.create({
      data: { kidId, weekStart, type: "REDEEM", minutes: -take, note: "Used screen time" },
    });
    return { ok: true, used: take };
  });

  revalidateAll(kidId);
  return result;
}

/** Parent adjusts a kid's minutes (+15 bonus / −15) with a history entry. */
export async function adjustMinutes(kidId: string, delta: number): Promise<void> {
  await requireParent();
  await prisma.ledgerEntry.create({
    data: {
      kidId,
      weekStart: weekStartISO(new Date()),
      type: "ADJUST",
      minutes: delta,
      note: delta >= 0 ? "Bonus minutes" : "Minutes removed",
    },
  });
  revalidateAll(kidId);
}

/** Parent grants one celebration token to a kid. */
export async function grantCelebrationToken(kidId: string): Promise<void> {
  await requireParent();
  await prisma.celebrationToken.create({ data: { kidId, event: "GRANT" } });
  revalidateAll(kidId);
}

/** Parent removes one unredeemed celebration token (no-op when the bank is empty). */
export async function revokeCelebrationToken(kidId: string): Promise<void> {
  await requireParent();
  await prisma.$transaction(async (tx) => {
    const events = await tx.celebrationToken.findMany({
      where: { kidId },
      select: { event: true },
    });
    if (tokenBalance(events) <= 0) return;
    await tx.celebrationToken.create({ data: { kidId, event: "REVOKE" } });
  });
  revalidateAll(kidId);
}

/**
 * Kid redeems one celebration token. Balance is checked and the REDEEM inserted
 * in one transaction so a double-tap can't spend below zero.
 */
export async function redeemCelebrationToken(
  kidId: string,
): Promise<{ ok: boolean }> {
  const result = await prisma.$transaction(async (tx) => {
    const events = await tx.celebrationToken.findMany({
      where: { kidId },
      select: { event: true },
    });
    if (tokenBalance(events) <= 0) return { ok: false };
    await tx.celebrationToken.create({ data: { kidId, event: "REDEEM" } });
    return { ok: true };
  });
  revalidateAll(kidId);
  return result;
}

/** Mark a kid's earn-celebration as seen so it doesn't replay. */
export async function markCelebrated(ledgerId: string): Promise<void> {
  const entry = await prisma.ledgerEntry.update({
    where: { id: ledgerId },
    data: { celebrated: true },
  });
  revalidateAll(entry.kidId);
}

/** Verify the parent PIN; on success, unlock the parent view for the session. */
export async function verifyPin(pin: string): Promise<{ ok: boolean }> {
  const setting = await prisma.setting.findUnique({ where: { key: "parentPin" } });
  const expected = setting?.value ?? "1234";
  if (pin !== expected) return { ok: false };

  (await cookies()).set(PARENT_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return { ok: true };
}
