import { cn } from "@/lib/cn";

export function MinutesSummary({
  gained,
  capMins,
  /** Bump a key to replay the count animation when the total changes. */
  pulseKey,
}: {
  gained: number;
  capMins: number;
  pulseKey: number;
}) {
  const pct = capMins > 0 ? Math.min(100, (gained / capMins) * 100) : 0;
  const capHrs = capMins / 60;
  const capLabel = Number.isInteger(capHrs) ? `${capHrs}` : capHrs.toFixed(1);

  return (
    <section className="px-6 pt-6">
      <div className="flex items-center gap-4">
        <span
          key={pulseKey}
          className="fos-count font-display text-[88px] font-semibold leading-[0.82] tracking-tight text-ink"
        >
          {gained}
        </span>
        <span className="font-display text-xl font-semibold uppercase leading-tight tracking-[0.04em] text-accent">
          Minutes
          <br />
          Gained
        </span>
      </div>

      {/* Progress toward the weekly cap */}
      <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-track">
        <div
          className={cn("fos-smooth h-full rounded-full bg-accent")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[15px] font-semibold text-muted">
        <span>
          {gained} of {capMins} mins
        </span>
        <span>max {capLabel} hrs / week</span>
      </div>
    </section>
  );
}
