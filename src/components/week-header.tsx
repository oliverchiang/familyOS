import { cn } from "@/lib/cn";
import type { KidWeek } from "@/lib/types";
import { Avatar, ChevronLeft, ChevronRight } from "./icons";

export function WeekHeader({
  week,
  onPrevWeek,
  onNextWeek,
}: {
  week: KidWeek;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}) {
  return (
    <header className="px-6 pt-7 pb-6">
      {/* Greeting */}
      <div className="flex items-center gap-4">
        <Avatar className="h-[72px] w-[72px] shrink-0" />
        <div className="leading-tight">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            {week.kidName}
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Hi, {week.kidName}
          </h1>
        </div>
      </div>

      {/* Week navigation */}
      <div className="mt-6 flex items-center justify-between">
        <NavButton label="Previous week" onClick={onPrevWeek}>
          <ChevronLeft className="h-5 w-5" />
        </NavButton>

        <div className="text-center leading-tight">
          <p className="font-display text-2xl font-semibold text-ink">
            {week.weekLabel}
          </p>
          {week.isCurrentWeek && (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              This week
            </p>
          )}
        </div>

        <NavButton label="Next week" onClick={onNextWeek}>
          <ChevronRight className="h-5 w-5" />
        </NavButton>
      </div>

      {/* Day strip */}
      <div className="mt-5 grid grid-cols-7 gap-1 rounded-3xl bg-sunken px-2 py-3">
        {week.days.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted">
              {day.label}
            </span>
            <span
              className={cn(
                "flex h-11 w-9 items-center justify-center rounded-xl text-lg font-bold",
                day.isToday
                  ? "border-2 border-ink bg-surface text-ink"
                  : "text-faint",
              )}
            >
              {day.date}
            </span>
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                day.active ? "bg-accent" : "bg-transparent",
              )}
            />
          </div>
        ))}
      </div>
    </header>
  );
}

function NavButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-transform active:scale-90 hover:bg-sunken"
    >
      {children}
    </button>
  );
}
