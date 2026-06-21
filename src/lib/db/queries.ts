import { prisma } from "@/lib/prisma";
import { computeLeft, gainedFromTasks, tallyDots, tokenBalance } from "@/lib/economy";
import {
  DEFAULT_TIME_ZONE,
  dayCellState,
  formatWeekLabel,
  localISODate,
  relativeWeek,
  weekStartISO,
} from "@/lib/week";
import type {
  AvatarKey,
  HistoryItem,
  KidWeekView,
  ParentDeskView,
  ProfileSummary,
  QueueItem,
  TaskKind,
  TaskView,
} from "@/lib/types";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function weekDates(weekStart: string): Array<{ iso: string; n: number }> {
  return Array.from({ length: 7 }, (_, i) => {
    const iso = addDaysISO(weekStart, i);
    return { iso, n: Number(iso.split("-")[2]) };
  });
}

type KidRecord = {
  id: string;
  name: string;
  avatarKey: string;
  weeklyCapMins: number;
};

/** Core assembler: a kid's full week view from the database. */
async function assembleKidWeek(
  kid: KidRecord,
  weekStart: string,
  currentWeekStart: string,
  todayISO: string,
  tz: string,
): Promise<KidWeekView> {
  const rel = relativeWeek(weekStart, currentWeekStart);

  const [tasks, completions, ledger, tokenEvents] = await Promise.all([
    prisma.task.findMany({
      where: { kidId: kid.id, active: true },
      orderBy: { order: "asc" },
    }),
    prisma.completion.findMany({
      where: { kidId: kid.id, weekStart, status: { in: ["APPROVED", "PENDING"] } },
      select: { taskId: true, status: true, createdAt: true },
    }),
    prisma.ledgerEntry.findMany({
      where: { kidId: kid.id, weekStart },
      orderBy: { createdAt: "desc" },
    }),
    // Tokens are persistent (not week-scoped): balance is the same on any week.
    prisma.celebrationToken.findMany({
      where: { kidId: kid.id },
      select: { event: true },
    }),
  ]);

  const approvedByTask = new Map<string, number>();
  const pendingByTask = new Map<string, number>();
  const activeDays = new Set<string>();
  for (const c of completions) {
    if (c.status === "APPROVED") {
      approvedByTask.set(c.taskId, (approvedByTask.get(c.taskId) ?? 0) + 1);
    } else {
      pendingByTask.set(c.taskId, (pendingByTask.get(c.taskId) ?? 0) + 1);
    }
    activeDays.add(localISODate(c.createdAt, tz));
  }

  const taskViews: TaskView[] = tasks.map((t) => {
    const approved = approvedByTask.get(t.id) ?? 0;
    const pending = pendingByTask.get(t.id) ?? 0;
    const capped = Math.min(approved, t.targetCount);
    return {
      id: t.id,
      title: t.title,
      kind: t.kind as TaskKind,
      display: t.display === "TALLY" ? "tally" : "bar",
      target: t.targetCount,
      reward: t.rewardMins,
      approved,
      pending,
      earned: approved >= t.targetCount,
      dots: tallyDots(capped, pending, t.targetCount),
      barPct: Math.round((capped / t.targetCount) * 100),
    };
  });

  const gained = gainedFromTasks(
    taskViews.map((t) => ({ approved: t.approved, target: t.target, reward: t.reward })),
  );

  let redeemed = 0;
  let adjust = 0;
  for (const l of ledger) {
    if (l.type === "REDEEM") redeemed += Math.abs(l.minutes);
    else if (l.type === "ADJUST") adjust += l.minutes;
  }

  const isCurrent = rel.state === "current";
  const left = isCurrent ? computeLeft(gained, redeemed, adjust) : 0;

  const dates = weekDates(weekStart);
  const todayIndex = isCurrent ? dates.findIndex((d) => d.iso === todayISO) : -1;
  const days = dates.map((d, i) => ({
    w: DAY_LABELS[i],
    n: d.n,
    st: dayCellState(rel.state, i, todayIndex, activeDays.has(d.iso)),
  }));

  let celebration: KidWeekView["celebration"] = null;
  if (isCurrent) {
    const cel = ledger.find((l) => l.type === "EARN" && !l.celebrated);
    if (cel) {
      const task = tasks.find((t) => t.id === cel.taskId);
      celebration = {
        ledgerId: cel.id,
        who: kid.name,
        mins: cel.minutes,
        task: task?.title ?? "A task",
      };
    }
  }

  return {
    kidId: kid.id,
    kidName: kid.name,
    avatarKey: kid.avatarKey as AvatarKey,
    meta: { weekStart, label: formatWeekLabel(weekStart), tag: rel.tag, state: rel.state },
    days,
    tasks: taskViews,
    gained,
    left,
    redeemed,
    weeklyCapMins: kid.weeklyCapMins,
    celebrationTokens: tokenBalance(tokenEvents),
    isCurrent,
    isPast: rel.state === "past",
    isFuture: rel.state === "future",
    prevWeekStart: addDaysISO(weekStart, -7),
    nextWeekStart: addDaysISO(weekStart, 7),
    celebration,
  };
}

export async function getKidWeekView(
  kidId: string,
  weekStartParam?: string,
): Promise<KidWeekView | null> {
  const tz = DEFAULT_TIME_ZONE;
  const now = new Date();
  const currentWeekStart = weekStartISO(now, tz);
  const todayISO = localISODate(now, tz);

  // Snap any valid ?week= date to its Monday; ignore malformed input.
  let weekStart = currentWeekStart;
  if (weekStartParam && /^\d{4}-\d{2}-\d{2}$/.test(weekStartParam)) {
    const parsed = new Date(`${weekStartParam}T12:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) weekStart = weekStartISO(parsed, tz);
  }

  const kid = await prisma.familyMember.findUnique({ where: { id: kidId } });
  if (!kid || kid.role !== "KID") return null;

  return assembleKidWeek(kid, weekStart, currentWeekStart, todayISO, tz);
}

export async function getFamilyOverview(): Promise<ProfileSummary[]> {
  const tz = DEFAULT_TIME_ZONE;
  const now = new Date();
  const cws = weekStartISO(now, tz);
  const todayISO = localISODate(now, tz);

  const members = await prisma.familyMember.findMany({ orderBy: { order: "asc" } });
  const pendingCount = await prisma.completion.count({
    where: { weekStart: cws, status: "PENDING", kid: { role: "KID" } },
  });

  return Promise.all(
    members.map(async (m): Promise<ProfileSummary> => {
      if (m.role === "KID") {
        const w = await assembleKidWeek(m, cws, cws, todayISO, tz);
        const instrument = w.tasks.find((t) => t.display === "tally");
        return {
          id: m.id,
          name: m.name,
          avatarKey: m.avatarKey as AvatarKey,
          isKid: true,
          roleLabel: `${instrument?.title ?? "Practice"} · homework`,
          stat: w.left,
          statLabel: "mins to use",
        };
      }
      return {
        id: m.id,
        name: m.name,
        avatarKey: m.avatarKey as AvatarKey,
        isKid: false,
        roleLabel: "Parent · approves tasks",
        stat: pendingCount,
        statLabel: "to check",
      };
    }),
  );
}

function historyText(type: string, minutes: number, taskTitle?: string | null): string {
  if (type === "EARN") return `${taskTitle ?? "Task"} target`;
  if (type === "REDEEM") return "Used screen time";
  return minutes >= 0 ? "Bonus minutes" : "Minutes removed";
}

function tokenHistoryText(event: string): string {
  if (event === "GRANT") return "Celebration added";
  if (event === "REDEEM") return "Redeemed a celebration";
  return "Celebration removed";
}

function relTime(date: Date, now: Date, tz: string): string {
  if (localISODate(date, tz) === localISODate(now, tz)) return "Today";
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short" }).format(date);
}

export async function getParentDeskView(): Promise<ParentDeskView> {
  const tz = DEFAULT_TIME_ZONE;
  const now = new Date();
  const cws = weekStartISO(now, tz);
  const todayISO = localISODate(now, tz);

  const kids = await prisma.familyMember.findMany({
    where: { role: "KID" },
    orderBy: { order: "asc" },
  });

  const pendings = await prisma.completion.findMany({
    where: { weekStart: cws, status: "PENDING", kid: { role: "KID" } },
    include: { task: true, kid: true },
    orderBy: { createdAt: "asc" },
  });
  const queue: QueueItem[] = pendings.map((p) => ({
    completionId: p.id,
    kidId: p.kidId,
    kidName: p.kid.name,
    taskTitle: p.task.title,
    kind: p.task.kind as TaskKind,
    reward: p.task.rewardMins,
  }));

  const kidSummaries = await Promise.all(
    kids.map(async (k) => {
      const w = await assembleKidWeek(k, cws, cws, todayISO, tz);
      return {
        kidId: k.id,
        name: k.name,
        avatarKey: k.avatarKey as AvatarKey,
        gained: w.gained,
        celebrationTokens: w.celebrationTokens,
        tasks: w.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          kind: t.kind,
          approved: t.approved,
          target: t.target,
          reward: t.reward,
          earned: t.earned,
          barPct: t.barPct,
        })),
      };
    }),
  );

  // Interleave the minute ledger and the token log into one recent-activity feed.
  const [ledger, tokenLog] = await Promise.all([
    prisma.ledgerEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { kid: true, task: true },
    }),
    prisma.celebrationToken.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { kid: true },
    }),
  ]);

  const dated: Array<{ createdAt: Date; item: HistoryItem }> = [
    ...ledger.map((l) => ({
      createdAt: l.createdAt,
      item: {
        who: l.kid.name,
        text: historyText(l.type, l.minutes, l.task?.title),
        amount: l.minutes,
        unit: "min" as const,
        kind: (l.type === "EARN" ? "earn" : l.type === "REDEEM" ? "redeem" : "adjust") as HistoryItem["kind"],
        time: relTime(l.createdAt, now, tz),
      },
    })),
    ...tokenLog.map((t) => ({
      createdAt: t.createdAt,
      item: {
        who: t.kid.name,
        text: tokenHistoryText(t.event),
        amount: t.event === "GRANT" ? 1 : -1,
        unit: "token" as const,
        kind: "token" as const,
        time: relTime(t.createdAt, now, tz),
      },
    })),
  ];
  const history: HistoryItem[] = dated
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8)
    .map((d) => d.item);

  return { weekLabel: formatWeekLabel(cws), queue, kids: kidSummaries, history };
}
