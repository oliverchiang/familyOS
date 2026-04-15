import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import KidPlanner from "./kid-planner";

export const dynamic = "force-dynamic";

export default async function KidPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date } = await searchParams;

  const kid = await prisma.familyMember.findUnique({ where: { id } });
  if (!kid || kid.role !== "KID") return notFound();

  const today = new Date().toISOString().split("T")[0];
  const selectedDate = date || today;

  const tasks = await prisma.task.findMany({
    where: { kidId: id, date: selectedDate },
    include: { video: true },
    orderBy: { order: "asc" },
  });

  const weekStart = getWeekStart(selectedDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const weekTaskCounts = await prisma.task.groupBy({
    by: ["date"],
    where: { kidId: id, date: { in: weekDates } },
    _count: true,
  });

  const taskCountByDate: Record<string, number> = {};
  for (const row of weekTaskCounts) {
    taskCountByDate[row.date] = row._count;
  }

  const allApproved = await prisma.task.findMany({
    where: { kidId: id, status: "APPROVED" },
  });
  const totalEarned = allApproved.reduce((sum, t) => sum + t.points, 0);

  const claims = await prisma.rewardClaim.findMany({
    where: { kidId: id },
    include: { reward: true },
  });
  const totalSpent = claims.reduce((sum, c) => sum + c.reward.pointsCost, 0);
  const balance = totalEarned - totalSpent;

  const rewards = await prisma.reward.findMany({
    orderBy: { pointsCost: "asc" },
  });

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-10">
        <Link
          href="/"
          className="text-muted hover:text-white text-base md:text-lg py-2 px-3 -ml-3 rounded-xl active:bg-white/5 transition-colors"
        >
          &larr; Home
        </Link>
        <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 px-5 py-3 md:px-6 md:py-3 rounded-full">
          <span className="text-xl md:text-2xl">⭐</span>
          <span className="font-bold text-amber-400 text-lg md:text-xl">
            {balance} pts
          </span>
        </div>
      </div>

      {/* Kid avatar & name */}
      <div className="text-center mb-6 md:mb-8">
        <div className="text-6xl md:text-8xl mb-3">{kid.avatar}</div>
        <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          {kid.name}&apos;s Plan
        </h1>
      </div>

      <KidPlanner
        kidId={kid.id}
        initialTasks={tasks}
        rewards={rewards}
        pointBalance={balance}
        selectedDate={selectedDate}
        today={today}
        weekDates={weekDates}
        taskCountByDate={taskCountByDate}
      />
    </div>
  );
}

function getWeekStart(dateStr: string): Date {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}
