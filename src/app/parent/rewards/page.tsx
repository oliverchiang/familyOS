import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RewardManager from "./reward-manager";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const rewards = await prisma.reward.findMany({
    orderBy: { pointsCost: "asc" },
  });

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/parent"
          className="text-muted hover:text-white text-sm py-2 px-3 -ml-3 rounded-xl active:bg-white/5 transition-colors"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
        Manage Rewards
      </h1>
      <p className="text-muted mb-8">
        Create rewards that kids can claim with their points
      </p>

      <RewardManager initialRewards={rewards} />
    </div>
  );
}
