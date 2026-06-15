import { KidWeeklyView } from "@/components/kid-weekly-view";
import { getFirstKidId, getKidWeek } from "@/lib/db/kid-week";

// Reads live, time-dependent data and is mutated via server actions — render
// per request rather than prerendering at build time.
export const dynamic = "force-dynamic";

// Until the profile-switch screen exists, the home page shows the first kid.
export default async function Home() {
  const kidId = await getFirstKidId();
  const week = kidId ? await getKidWeek(kidId) : null;

  if (!week) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg p-6 text-center">
        <p className="max-w-xs font-display text-xl text-ink">
          No family data yet. Run <code className="font-mono">npm run db:seed</code> to
          get started.
        </p>
      </main>
    );
  }

  return <KidWeeklyView week={week} />;
}
