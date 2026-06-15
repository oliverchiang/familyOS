"use client";

import { useOptimistic, useTransition } from "react";
import { logCompletion } from "@/app/actions";
import { cn } from "@/lib/cn";
import { isComplete, minutesGained, type KidWeek, type Task } from "@/lib/types";
import { ArrowRight } from "./icons";
import { MinutesSummary } from "./minutes-summary";
import { TaskRow } from "./task-row";
import { WeekHeader } from "./week-header";

export function KidWeeklyView({ week }: { week: KidWeek }) {
  const [, startTransition] = useTransition();

  // Optimistically advance a task's progress so taps feel instant; the server
  // action persists it and revalidates, resetting this to the real data.
  const [tasks, bumpTask] = useOptimistic(week.tasks, (current: Task[], taskId: string) =>
    current.map((t) =>
      t.id === taskId && !isComplete(t) ? { ...t, done: t.done + 1 } : t,
    ),
  );

  const gained = minutesGained(tasks);

  function handleDidIt(taskId: string) {
    startTransition(async () => {
      bumpTask(taskId);
      await logCompletion(taskId);
    });
  }

  return (
    <main className="flex min-h-dvh justify-center bg-bg sm:items-center sm:p-6">
      <div
        className={cn(
          "fos-rise flex w-full max-w-[430px] flex-col bg-surface",
          "min-h-dvh sm:min-h-0 sm:rounded-[34px] sm:shadow-[0_34px_90px_-24px_rgba(40,32,20,0.45)]",
          "overflow-hidden",
        )}
      >
        <WeekHeader
          week={week}
          onPrevWeek={() => {
            /* Multi-week navigation arrives with week history. */
          }}
          onNextWeek={() => {
            /* Multi-week navigation arrives with week history. */
          }}
        />

        <div className="h-px bg-ink/85" />

        <MinutesSummary gained={gained} capMins={week.weeklyCapMins} pulseKey={gained} />

        <section className="px-6 pt-7">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            This week&rsquo;s tasks
          </h2>
          <div className="mt-1 divide-y divide-line">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} onDidIt={handleDidIt} />
            ))}
          </div>
        </section>

        <div className="px-6 pb-7 pt-6">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-3xl bg-accent py-5 font-display text-xl font-semibold text-surface transition-transform active:scale-[0.98] hover:brightness-105"
          >
            Use screen time
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </main>
  );
}
