import { HomeView } from "@/components/home-view";
import { getFamilyOverview } from "@/lib/db/queries";
import { DEFAULT_TIME_ZONE, localISODate } from "@/lib/week";

export const dynamic = "force-dynamic";

function eyebrowFor(now: Date): string {
  const tz = DEFAULT_TIME_ZONE;
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "long" })
    .format(now)
    .toUpperCase();
  const [y, m, d] = localISODate(now, tz).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7) + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3,
  );
  const week = 1 + Math.round((dt.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${weekday} · Wk ${week}`;
}

export default async function Home() {
  const profiles = await getFamilyOverview();

  if (profiles.length === 0) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-paper p-6 text-center">
        <p className="max-w-xs text-xl font-bold text-ink">
          No family data yet. Run <code className="font-mono">npm run db:seed</code>.
        </p>
      </main>
    );
  }

  return <HomeView profiles={profiles} eyebrow={eyebrowFor(new Date())} />;
}
