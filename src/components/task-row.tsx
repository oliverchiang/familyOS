import { cn } from "@/lib/cn";
import { isComplete, type Task, type TileColor } from "@/lib/types";
import { CheckIcon, TaskIcon } from "./icons";

const TILE_BG: Record<TileColor, string> = {
  drums: "bg-tile-drums",
  book: "bg-tile-book",
  maths: "bg-tile-maths",
};

export function TaskRow({
  task,
  onDidIt,
}: {
  task: Task;
  onDidIt: (taskId: string) => void;
}) {
  const complete = isComplete(task);

  return (
    <div className="flex items-center gap-4 py-5">
      {/* Icon tile */}
      <div
        className={cn(
          "flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-2xl text-ink",
          TILE_BG[task.tile],
        )}
      >
        <TaskIcon name={task.icon} className="h-7 w-7" />
      </div>

      {/* Title + progress */}
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-xl font-semibold text-ink">
          {task.title}
        </h3>
        <div className="mt-2">
          {task.display === "tally" ? (
            <TallyProgress done={task.done} target={task.target} />
          ) : (
            <BarProgress done={task.done} target={task.target} />
          )}
        </div>
      </div>

      {/* Action / reward */}
      <div className="shrink-0">
        {complete ? (
          <CompletedBadge rewardMins={task.rewardMins} />
        ) : (
          <button
            type="button"
            onClick={() => onDidIt(task.id)}
            className="rounded-2xl bg-ink px-5 py-3 font-display text-base font-semibold text-surface transition-transform active:scale-90 hover:opacity-90"
          >
            I did it
          </button>
        )}
      </div>
    </div>
  );
}

function TallyProgress({ done, target }: { done: number; target: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: target }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "fos-smooth h-[22px] w-[22px] rounded-md",
            i < done
              ? "bg-ink"
              : "border-2 border-dashed border-faint bg-transparent",
          )}
        />
      ))}
    </div>
  );
}

function BarProgress({ done, target }: { done: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (done / target) * 100) : 0;
  return (
    <div className="h-2.5 w-full max-w-[230px] overflow-hidden rounded-full bg-track">
      <div
        className="fos-smooth h-full rounded-full bg-ink"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function CompletedBadge({ rewardMins }: { rewardMins: number }) {
  return (
    <div className="fos-pop flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green text-surface">
        <CheckIcon className="h-5 w-5" />
      </span>
      <span className="font-display text-lg font-semibold text-green">
        + {rewardMins}
      </span>
    </div>
  );
}
