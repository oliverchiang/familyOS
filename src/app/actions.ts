"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { syncAwards } from "@/lib/db/awards";
import { getKidWeekView } from "@/lib/db/queries";
import { prisma } from "@/lib/prisma";
import { weekStartISO } from "@/lib/week";

// Single-family, no-account prototype. The parent PIN gates the parent view;
// kid/parent mutations are otherwise unauthenticated by design.

const PARENT_COOKIE = "parent_unlocked";

function revalidateAll(kidId?: string) {
  revalidatePath("/");
  revalidatePath("/parent");
  if (kidId) revalidatePath(`/kid/${kidId}`);
}

/** Kid logs a task — creates a PENDING completion (awaits parent approval). */
export async function logCompletion(taskId: string): Promise<void> {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error(`Unknown task: ${taskId}`);

  await prisma.completion.create({
    data: {
      taskId: task.id,
      kidId: task.kidId,
      weekStart: weekStartISO(new Date()),
      status: "PENDING",
    },
  });
  revalidateAll(task.kidId);
}

/** Parent approves one pending completion; may cross a target and award minutes. */
export async function approveCompletion(completionId: string): Promise<void> {
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
  const completion = await prisma.completion.findUnique({ where: { id: completionId } });
  if (!completion || completion.status !== "PENDING") return;

  await prisma.completion.update({
    where: { id: completionId },
    data: { status: "REJECTED" },
  });
  revalidateAll(completion.kidId);
}

/** Kid redeems screen time — capped at the minutes left this week. */
export async function redeemMinutes(
  kidId: string,
  amountMins: number,
): Promise<{ ok: boolean; used: number }> {
  const view = await getKidWeekView(kidId);
  if (!view) return { ok: false, used: 0 };

  const take = Math.min(amountMins, view.left);
  if (take <= 0) return { ok: false, used: 0 };

  await prisma.ledgerEntry.create({
    data: {
      kidId,
      weekStart: weekStartISO(new Date()),
      type: "REDEEM",
      minutes: -take,
      note: "Used screen time",
    },
  });
  revalidateAll(kidId);
  return { ok: true, used: take };
}

/** Parent adjusts a kid's minutes (+15 bonus / −15) with a history entry. */
export async function adjustMinutes(kidId: string, delta: number): Promise<void> {
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
    path: "/",
  });
  return { ok: true };
}

/** Whether the parent view is unlocked this session. */
export async function isParentUnlocked(): Promise<boolean> {
  return (await cookies()).get(PARENT_COOKIE)?.value === "1";
}
