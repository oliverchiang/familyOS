import { prisma } from "@/lib/prisma";
import { plannedAwards } from "@/lib/economy";
import type { Prisma } from "@prisma/client";

/**
 * Reconcile a kid's EARN entries with their approved steps for the week. Each
 * approved step earns its share of the task's reward (see plannedAwards), so an
 * approval adds one EARN and an undo removes exactly that step's EARN.
 *
 * Idempotent: an EARN is keyed to its completion, so re-running never
 * double-pays. Entries are also rewritten when a step's value shifts — pulling
 * a step out moves the rounding remainder onto a different step.
 *
 * `celebrated` marks seeded/back-filled awards as already seen so the kid view
 * doesn't replay their celebration.
 */
export async function syncAwards(
  kidId: string,
  weekStart: string,
  opts: { celebrated?: boolean } = {},
): Promise<void> {
  const tasks = await prisma.task.findMany({ where: { kidId, active: true } });
  const activeTaskIds = new Set(tasks.map((t) => t.id));

  const [completions, existing] = await Promise.all([
    prisma.completion.findMany({
      where: { kidId, weekStart, status: "APPROVED" },
      select: { id: true, taskId: true, approvedAt: true, createdAt: true },
    }),
    prisma.ledgerEntry.findMany({
      where: { kidId, weekStart, type: "EARN" },
      select: { id: true, taskId: true, completionId: true, minutes: true },
    }),
  ]);

  // Steps in the order they were approved — that's the order the reward pays out
  // in, so the same step keeps the same value as long as it stands.
  const ordered = [...completions].sort((a, b) => {
    const at = (a.approvedAt ?? a.createdAt).getTime();
    const bt = (b.approvedAt ?? b.createdAt).getTime();
    return at - bt || a.id.localeCompare(b.id);
  });
  const stepsByTask = new Map<string, string[]>();
  for (const c of ordered) {
    const steps = stepsByTask.get(c.taskId);
    if (steps) steps.push(c.id);
    else stepsByTask.set(c.taskId, [c.id]);
  }

  // Desired state. Steps worth nothing (a reward smaller than its target) get no
  // entry, so the kid never sees a "+0 mins" award.
  const planned = tasks
    .flatMap((t) =>
      plannedAwards(
        { taskId: t.id, target: t.targetCount, reward: t.rewardMins },
        stepsByTask.get(t.id) ?? [],
      ),
    )
    .filter((a) => a.minutes > 0);
  const plannedByCompletion = new Map(planned.map((a) => [a.completionId, a]));

  // Drop entries that no longer match the plan: steps since withdrawn, steps
  // whose value changed, and lump-sum entries predating per-step awards. Only
  // reconcile tasks we still know about — leave earns for removed/inactive
  // tasks alone.
  const stale = existing.filter((e) => {
    if (e.taskId === null || !activeTaskIds.has(e.taskId)) return false;
    if (e.completionId === null) return true;
    const want = plannedByCompletion.get(e.completionId);
    return !want || want.minutes !== e.minutes;
  });
  const staleIds = new Set(stale.map((e) => e.id));

  const awarded = new Set(
    existing
      .filter((e) => !staleIds.has(e.id) && e.completionId !== null)
      .map((e) => e.completionId as string),
  );
  const toAward = planned.filter((a) => !awarded.has(a.completionId));

  const writes: Prisma.PrismaPromise<unknown>[] = [];
  if (stale.length > 0) {
    writes.push(prisma.ledgerEntry.deleteMany({ where: { id: { in: [...staleIds] } } }));
  }
  if (toAward.length > 0) {
    // skipDuplicates + the unique completionId make this safe under concurrent
    // approvals — a step is paid at most once.
    writes.push(
      prisma.ledgerEntry.createMany({
        data: toAward.map((a) => ({
          kidId,
          weekStart,
          type: "EARN" as const,
          minutes: a.minutes,
          taskId: a.taskId,
          completionId: a.completionId,
          note: "Step done",
          celebrated: opts.celebrated ?? false,
        })),
        skipDuplicates: true,
      }),
    );
  }
  if (writes.length > 0) await prisma.$transaction(writes);
}
