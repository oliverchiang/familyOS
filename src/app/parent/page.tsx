import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ParentDashboard from "./parent-dashboard";

export const dynamic = "force-dynamic";

export default async function ParentPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const today = new Date().toISOString().split("T")[0];
  const selectedDate = date || today;

  const kids = await prisma.familyMember.findMany({
    where: { role: "KID" },
    orderBy: { name: "asc" },
  });

  const tasks = await prisma.task.findMany({
    where: { date: selectedDate },
    include: { video: true, kid: true },
    orderBy: { order: "asc" },
  });

  const recentClaims = await prisma.rewardClaim.findMany({
    take: 10,
    orderBy: { claimedAt: "desc" },
    include: { kid: true, reward: true },
  });

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="text-muted hover:text-white text-sm py-2 px-3 -ml-3 rounded-xl active:bg-white/5 transition-colors"
        >
          &larr; Home
        </Link>
        <Link
          href="/parent/rewards"
          className="bg-gradient-to-r from-violet-500 to-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-violet-400 hover:to-purple-400 transition shadow-lg shadow-purple-500/20"
        >
          Manage Rewards
        </Link>
      </div>

      <h1 className="text-3xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-1">
        Parent Dashboard
      </h1>

      <ParentDashboard
        kids={kids}
        tasks={tasks}
        recentClaims={recentClaims}
        selectedDate={selectedDate}
        today={today}
      />
    </div>
  );
}
