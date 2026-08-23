// Pure economy rules for the weekly screen-time ledger.
// The ledger (signed minute entries) is the source of truth for a kid's
// balance; targets earn a lump-sum EARN entry once their weekly target is met.

import type { TallyDot } from "./types";

/** A task's weekly target is met once approved completions reach the target. */
export function isTargetMet(approvedCount: number, target: number): boolean {
  return approvedCount >= target;
}

/**
 * Minutes banked for a task after `approved` steps — the reward split across the
 * target rather than paid as a lump sum at the end. Rounded down mid-task and
 * clamped to the target, so the total at target is exactly `reward` and steps
 * logged beyond it earn nothing.
 */
export function earnedForSteps(approved: number, target: number, reward: number): number {
  if (target <= 0) return 0;
  const done = Math.min(Math.max(approved, 0), target);
  return Math.floor((reward * done) / target);
}

/**
 * Minutes the nth (1-indexed) approved step awards. Since it's the difference
 * between two `earnedForSteps` values, any rounding remainder lands on the final
 * step and the steps always sum to the full reward.
 */
export function stepAward(n: number, target: number, reward: number): number {
  if (n < 1 || n > target) return 0;
  return earnedForSteps(n, target, reward) - earnedForSteps(n - 1, target, reward);
}

/** Minutes earned this week = Σ each task's pro-rata earnings so far. */
export function gainedFromTasks(
  tasks: Array<{ approved: number; target: number; reward: number }>,
): number {
  return tasks.reduce((sum, t) => sum + earnedForSteps(t.approved, t.target, t.reward), 0);
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

/** One step's EARN: the completion that triggered it and what it's worth. */
export interface StepAward {
  completionId: string;
  taskId: string;
  minutes: number;
}

/**
 * The EARN entries a task's approved steps should have, given its completion ids
 * in approval order. Steps past the target are dropped (they earn nothing), so
 * this is the full desired state — reconcile the stored entries against it to
 * award new steps and claw back withdrawn ones.
 */
export function plannedAwards(
  task: { taskId: string; target: number; reward: number },
  approvedCompletionIds: string[],
): StepAward[] {
  return approvedCompletionIds.slice(0, Math.max(task.target, 0)).map((completionId, i) => ({
    completionId,
    taskId: task.taskId,
    minutes: stepAward(i + 1, task.target, task.reward),
  }));
}
