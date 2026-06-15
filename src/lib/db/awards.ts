import { prisma } from "@/lib/prisma";
import { tasksToAward } from "@/lib/economy";

/**
 * Ensure every task whose weekly target is met (by APPROVED completions) has its
 * EARN ledger entry. Idempotent: a reward is granted at most once per task/week.
 * `celebrated` marks seeded/back-filled earns as already seen so the kid view
 * doesn't replay their celebration.
 */
export async function syncAwards(
  kidId: string,
  weekStart: string,
  opts: { celebrated?: boolean } = {},
): Promise<void> {
  const tasks = await prisma.task.findMany({ where: { kidId, active: true } });

  const approvedCounts = await prisma.completion.groupBy({
    by: ["taskId"],
    where: { kidId, weekStart, status: "APPROVED" },
    _count: { _all: true },
  });
  const countByTask = new Map(approvedCounts.map((c) => [c.taskId, c._count._all]));

  const alreadyAwarded = await prisma.ledgerEntry.findMany({
    where: { kidId, weekStart, type: "EARN", taskId: { not: null } },
    select: { taskId: true },
  });
  const awardedTaskIds = new Set(
    alreadyAwarded.map((e) => e.taskId).filter((id): id is string => id !== null),
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
    });
  }
}
