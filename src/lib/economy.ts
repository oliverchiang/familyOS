// Pure economy rules for the weekly screen-time ledger.
// The ledger (signed minute entries) is the source of truth for a kid's
// balance; targets earn a lump-sum EARN entry once their weekly target is met.

import type { TallyDot } from "./types";

/** A task's weekly target is met once approved completions reach the target. */
export function isTargetMet(approvedCount: number, target: number): boolean {
  return approvedCount >= target;
}

/** Minutes earned this week = Σ reward for tasks at or over their target. */
export function gainedFromTasks(
  tasks: Array<{ approved: number; target: number; reward: number }>,
): number {
  return tasks.reduce(
    (sum, t) => (isTargetMet(t.approved, t.target) ? sum + t.reward : sum),
    0,
  );
}

/**
 * Task earnings are capped at the kid's weekly ceiling, so completing more
 * activities than the cap allows can't earn beyond it. Parent bonus/adjust
 * minutes are applied on top of this (see computeLeft) and are not capped.
 */
export function cappedGain(gained: number, capMins: number): number {
  return Math.min(gained, capMins);
}

/** Minutes left to use this week, floored at zero. */
export function computeLeft(gained: number, redeemed: number, adjust: number): number {
  return Math.max(0, gained - redeemed + adjust);
}

/**
 * Stacked-bar breakdown of the week's screen-time pool: how much has been used
 * vs. how much remains. `total` (used + remaining) reconciles task earnings and
 * any parent adjustments, so the bar always sums to 100%. `usedPct` is the
 * filled portion — it grows as the kid spends time, so the bar visibly moves.
 */
export function screenTimeBar(
  redeemed: number,
  left: number,
): { total: number; usedPct: number } {
  const total = redeemed + left;
  return { total, usedPct: total > 0 ? (redeemed / total) * 100 : 0 };
}

/** Tally squares: approved → on, then pending → pend, remainder → off. */
export function tallyDots(approved: number, pending: number, target: number): TallyDot[] {
  return Array.from({ length: target }, (_, i) =>
    i < approved ? "on" : i < approved + pending ? "pend" : "off",
  );
}

/** Current weekly balance = sum of signed ledger minutes. */
export function weekBalanceMins(entries: Array<{ minutes: number }>): number {
  return entries.reduce((sum, e) => sum + e.minutes, 0);
}

/** A redemption is valid if positive and within the available balance. */
export function canRedeem(balanceMins: number, amountMins: number): boolean {
  return amountMins > 0 && amountMins <= balanceMins;
}

export interface AwardCandidate {
  taskId: string;
  approvedCount: number;
  target: number;
  rewardMins: number;
}

/**
 * Tasks that have met their weekly target but have not yet been awarded.
 * Drives idempotent EARN creation — pass the set of task ids already awarded
 * this week so a reward is never granted twice.
 */
export function tasksToAward(
  candidates: AwardCandidate[],
  awardedTaskIds: Set<string>,
): AwardCandidate[] {
  return candidates.filter(
    (c) => isTargetMet(c.approvedCount, c.target) && !awardedTaskIds.has(c.taskId),
  );
}
