// Pure economy rules for the weekly screen-time ledger.
// The ledger (signed minute entries) is the source of truth for a kid's
// balance; targets earn a lump-sum EARN entry once their weekly target is met.

/** A task's weekly target is met once approved completions reach the target. */
export function isTargetMet(approvedCount: number, target: number): boolean {
  return approvedCount >= target;
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
