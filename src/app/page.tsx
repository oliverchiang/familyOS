import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const kids = await prisma.familyMember.findMany({
    where: { role: "KID" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      {/* Logo / title */}
      <div className="mb-12 text-center">
        <h1 className="text-6xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
          FamilyOS
        </h1>
        <p className="text-muted text-lg mt-3">
          Plan your day. Show your work. Earn rewards.
        </p>
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Kids */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted mb-4 text-center">
            I&apos;m a kid
          </h2>
          <div className="grid gap-3">
            {kids.map((kid) => (
              <Link
                key={kid.id}
                href={`/kid/${kid.id}`}
                className="glass flex items-center gap-4 rounded-2xl p-5 hover:bg-card-hover hover:border-amber-500/40 hover:glow-amber transition-all active:scale-[0.98] group"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">
                  {kid.avatar}
                </span>
                <div>
                  <div className="text-xl font-bold">{kid.name}</div>
                  <div className="text-sm text-muted">View my plan</div>
                </div>
                <span className="ml-auto text-muted group-hover:text-amber-400 transition-colors text-xl">
                  &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[var(--background)] px-4 text-sm text-muted">
              or
            </span>
          </div>
        </div>

        {/* Parent */}
        <Link
          href="/parent"
          className="flex items-center justify-center gap-3 rounded-2xl p-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20 group"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">
            👨‍👩‍👧‍👦
          </span>
          <span className="text-lg font-bold">Parent Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
