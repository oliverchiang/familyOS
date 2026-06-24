import { prisma } from "@/lib/prisma";
import { tasksToAward } from "@/lib/economy";

/**
 * Reconcile a kid's EARN entries with their met targets for the week. Adds an
 * EARN for any task now at/over target, and removes the EARN for any task that
 * has dropped below target (e.g. a parent undid an approval given by mistake).
 * Idempotent: a reward is granted at most once per task/week.
 * `celebrated` marks seeded/back-filled earns as already seen so the kid view
 * doesn't replay their celebration.
 */
export async function syncAwards(
  kidId: string,
  weekStart: string,
  opts: { celebrated?: boolean } = {},
): Promise<void> {
  const tasks = await prisma.task.findMany({ where: { kidId, active: true } });
  const targetByTask = new Map(tasks.map((t) => [t.id, t.targetCount]));

  const approvedCounts = await prisma.completion.groupBy({
    by: ["taskId"],
    where: { kidId, weekStart, status: "APPROVED" },
    _count: { _all: true },
  });
  const countByTask = new Map(approvedCounts.map((c) => [c.taskId, c._count._all]));

  const existingEarns = await prisma.ledgerEntry.findMany({
    where: { kidId, weekStart, type: "EARN", taskId: { not: null } },
    select: { id: true, taskId: true },
  });

  // Claw back any EARN whose task no longer meets its target. Only reconcile
  // tasks we still know about — leave earns for removed/inactive tasks alone.
  const stale = existingEarns.filter((e) => {
    const target = targetByTask.get(e.taskId!);
    return target !== undefined && (countByTask.get(e.taskId!) ?? 0) < target;
  });
  if (stale.length > 0) {
    await prisma.ledgerEntry.deleteMany({ where: { id: { in: stale.map((e) => e.id) } } });
  }
  const staleIds = new Set(stale.map((e) => e.id));

  const awardedTaskIds = new Set(
    existingEarns
      .filter((e) => !staleIds.has(e.id))
      .map((e) => e.taskId)
      .filter((id): id is string => id !== null),
  );

  const toAward = tasksToAward(
    tasks.map((t) => ({
      taskId: t.id,
      approvedCount: countByTask.get(t.id) ?? 0,
      target: t.targetCount,
      rewardMins: t.rewardMins,
    })),
    awardedTaskIds,
  );

  if (toAward.length > 0) {
    // skipDuplicates + the @@unique([kidId, weekStart, taskId]) make this safe
    // under concurrent approvals — a target's reward is granted at most once.
    await prisma.ledgerEntry.createMany({
      data: toAward.map((t) => ({
        kidId,
        weekStart,
        type: "EARN" as const,
        minutes: t.rewardMins,
        taskId: t.taskId,
        note: "Weekly target met",
        celebrated: opts.celebrated ?? false,
      })),
      skipDuplicates: true,
    });
  }
}
