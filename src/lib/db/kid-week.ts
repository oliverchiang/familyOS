import { prisma } from "@/lib/prisma";
import {
  DEFAULT_TIME_ZONE,
  formatWeekLabel,
  localISODate,
  weekStartISO,
} from "@/lib/week";
import type {
  IconName,
  KidWeek,
  Task as ViewTask,
  TaskDisplay,
  TileColor,
  WeekDay,
} from "@/lib/types";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/** Add `days` to an ISO date and return the resulting ISO date. */
function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  date.setUTCDate(date.getUTCDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** The lowest-ordered kid (used as the default profile until profile-switch lands). */
export async function getFirstKidId(): Promise<string | null> {
  const kid = await prisma.familyMember.findFirst({
    where: { role: "KID" },
    orderBy: { order: "asc" },
  });
  return kid?.id ?? null;
}

/**
 * Build the kid's current-week view model from the database: tasks with
 * approved progress, the day strip with activity dots, and minutes earned.
 */
export async function getKidWeek(
  kidId: string,
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE,
): Promise<KidWeek | null> {
  const kid = await prisma.familyMember.findUnique({ where: { id: kidId } });
  if (!kid) return null;

  const weekStart = weekStartISO(now, timeZone);
  const todayISO = localISODate(now, timeZone);

  const [tasks, completions] = await Promise.all([
    prisma.task.findMany({
      where: { kidId, active: true },
      orderBy: { order: "asc" },
    }),
    prisma.completion.findMany({
      where: { kidId, weekStart, approved: true },
      select: { taskId: true, createdAt: true },
    }),
  ]);

  // Approved completion count per task → display progress.
  const doneByTask = new Map<string, number>();
  const activeDays = new Set<string>();
  for (const c of completions) {
    doneByTask.set(c.taskId, (doneByTask.get(c.taskId) ?? 0) + 1);
    activeDays.add(localISODate(c.createdAt, timeZone));
  }

  const viewTasks: ViewTask[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    icon: t.icon as IconName,
    tile: t.tile as TileColor,
    display: t.display === "TALLY" ? "tally" : ("bar" as TaskDisplay),
    target: t.targetCount,
    done: Math.min(t.targetCount, doneByTask.get(t.id) ?? 0),
    rewardMins: t.rewardMins,
  }));

  const days: WeekDay[] = DAY_LABELS.map((label, i) => {
    const iso = addDaysISO(weekStart, i);
    return {
      label,
      date: Number(iso.split("-")[2]),
      active: activeDays.has(iso),
      isToday: iso === todayISO,
    };
  });

  return {
    kidName: kid.name,
    weekLabel: formatWeekLabel(weekStart),
    isCurrentWeek: weekStart === weekStartISO(new Date(), timeZone),
    weeklyCapMins: kid.weeklyCapMins,
    days,
    tasks: viewTasks,
  };
}
