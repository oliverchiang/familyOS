"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  logCompletion,
  markCelebrated,
  redeemCelebrationToken,
  redeemMinutes,
} from "@/app/actions";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/cn";
import { screenTimeBar, tallyDots } from "@/lib/economy";
import type { DayCell, KidWeekView, TaskView } from "@/lib/types";
import { Avatar, TaskIllustration } from "./illustrations";

export function KidDashboard({ view }: { view: KidWeekView }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemSel, setRedeemSel] = useState(Math.min(30, view.left) || 15);
  const [celebrated, setCelebrated] = useState(false);
  // Celebration-token redemption: confirm step → success celebration.
  const [tokenConfirmOpen, setTokenConfirmOpen] = useState(false);
  const [tokenCelebrate, setTokenCelebrate] = useState(false);
  // Shared-iPad landscape → split view; portrait/phone → single column.
  const landscape = useMediaQuery("(min-width: 820px) and (orientation: landscape)");

  const [tasks, bumpPending] = useOptimistic(view.tasks, (cur: TaskView[], id: string) =>
    cur.map((t) =>
      t.id === id && !t.earned
        ? {
            ...t,
            pending: t.pending + 1,
            dots: tallyDots(Math.min(t.approved, t.target), t.pending + 1, t.target),
          }
        : t,
    ),
  );

  function didIt(id: string) {
    startTransition(async () => {
      bumpPending(id);
      await logCompletion(id, view.meta.weekStart);
    });
  }

  function goWeek(weekStart: string) {
    router.push(`/kid/${view.kidId}?week=${weekStart}`);
  }

  function confirmRedeemToken() {
    setTokenConfirmOpen(false);
    startTransition(async () => {
      const res = await redeemCelebrationToken(view.kidId);
      if (res.ok) setTokenCelebrate(true);
    });
  }

  function dismissCelebration() {
    if (!view.celebration) return;
    setCelebrated(true);
    const id = view.celebration.ledgerId;
    startTransition(async () => {
      await markCelebrated(id);
    });
  }

  const tagColor = view.isCurrent
    ? "text-accent"
    : view.isFuture
      ? "text-faint"
      : "text-muted";

  const header = (
    <div className="flex items-center gap-[13px] px-[26px] pb-3.5 pt-1">
      <div className="shrink-0">
        <Avatar who={view.avatarKey} size={46} />
      </div>
      <div className="text-[22px] font-bold tracking-[-0.01em]">{view.kidName}</div>
    </div>
  );

  const weekPicker = (
    <div className="flex items-center gap-2 px-[22px] pb-3.5">
      <NavButton dir="prev" enabled onClick={() => goWeek(view.prevWeekStart)} />
      <div className="flex-1 text-center">
        <div className="text-[17px] font-bold tracking-[-0.01em]">{view.meta.label}</div>
        <div
          className={cn(
            "mt-px font-meta text-xs font-extrabold uppercase tracking-[0.04em]",
            tagColor,
          )}
        >
          {view.meta.tag}
        </div>
      </div>
      <NavButton dir="next" enabled onClick={() => goWeek(view.nextWeekStart)} />
    </div>
  );

  const calendar = (
    <div className="px-[18px] pb-4">
      <div className="grid grid-cols-7 gap-1 rounded-[14px] bg-tile px-2 py-2.5">
        {view.days.map((d, i) => (
          <DayCellEl key={i} cell={d} />
        ))}
      </div>
    </div>
  );

  // Current week: spotlight the minutes still LEFT (this is what drops as the
  // kid uses screen time) over an earned-vs-used bar. Other weeks: history.
  const bar = screenTimeBar(view.redeemed, view.left);

  const hero = view.isCurrent ? (
    <div className="border-t-[1.5px] border-ink px-[26px] py-[18px]">
      <div className="flex items-start gap-3">
        <span className="text-[84px] font-bold leading-[0.8] tracking-[-0.05em]">
          {view.left}
        </span>
        <span className="pt-1.5 text-sm font-semibold uppercase leading-[1.2] tracking-[0.08em] text-accent">
          minutes
          <br />
          left
        </span>
      </div>
      <div className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full bg-track">
        <div
          className="h-full rounded-l-full bg-ink/30 transition-[width] duration-300 ease-out"
          style={{ width: `${bar.usedPct}%` }}
        />
        <div className="h-full flex-1 bg-accent transition-[width] duration-300 ease-out" />
      </div>
      <div className="mt-2 flex justify-between font-meta text-[13px] font-bold text-muted">
        <span>{view.redeemed} used</span>
        <span>{bar.total} earned</span>
      </div>
    </div>
  ) : (
    <div className="border-t-[1.5px] border-ink px-[26px] py-[18px]">
      <div className="flex items-start gap-3">
        <span className="text-[84px] font-bold leading-[0.8] tracking-[-0.05em]">
          {view.gained}
        </span>
        <span className="pt-1.5 text-sm font-semibold uppercase leading-[1.2] tracking-[0.08em] text-accent">
          minutes
          <br />
          gained
        </span>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-track">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${Math.min(view.gained, view.weeklyCapMins) / view.weeklyCapMins * 100}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between font-meta text-[13px] font-bold text-muted">
        <span>
          {view.gained} of {view.weeklyCapMins} mins
        </span>
        <span>max {view.weeklyCapMins / 60} hrs / week</span>
      </div>
    </div>
  );

  const taskList = (
    <div className="px-[26px]">
      <div className="pt-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">
        Tasks
      </div>
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} view={view} onDidIt={didIt} />
      ))}
    </div>
  );

  const footer = (
    <div className="px-[26px] pb-7 pt-5">
      {view.isCurrent ? (
        <div>
          <button
            type="button"
            onClick={() => {
              setRedeemSel(Math.min(30, view.left) || 15);
              setRedeemOpen(true);
            }}
            className="h-[54px] w-full rounded-[10px] bg-accent text-base font-bold text-white transition-transform active:scale-[0.99]"
          >
            Use screen time →
          </button>
          <div className="mt-2.5 text-center font-meta text-[13px] font-bold text-muted">
            {view.left} mins left to use this week
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "py-2 text-center font-meta text-sm font-extrabold",
            view.isFuture ? "text-faint" : "text-muted",
          )}
        >
          {view.isFuture
            ? "Get ahead — tap a task to log it early"
            : `Week finished · ${view.gained} mins gained`}
        </div>
      )}
    </div>
  );

  // Persistent celebration-token "piggy bank" — separate from screen time.
  const celebrations = view.isCurrent ? (
    <div className="px-[26px] pb-1 pt-3">
      <div className="flex items-center gap-3.5 rounded-[14px] bg-tile px-[18px] py-[15px]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] bg-paper text-[26px]">
          🎉
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold">Celebrations</div>
          <div className="font-meta text-[13px] font-bold text-muted">
            {view.celebrationTokens === 0
              ? "None saved up yet"
              : `${view.celebrationTokens} to redeem`}
          </div>
        </div>
        <button
          type="button"
          disabled={view.celebrationTokens <= 0}
          onClick={() => setTokenConfirmOpen(true)}
          className="h-10 shrink-0 rounded-[10px] bg-accent px-4 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-40"
        >
          Redeem
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div
      className={cn(
        "relative mx-auto flex h-dvh w-full flex-col overflow-hidden bg-paper",
        landscape ? "max-w-[1180px]" : "max-w-[640px]",
      )}
    >
      {/* top bar */}
      <div className="flex items-center gap-3 px-[22px] pb-3.5 pt-5">
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Back"
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[11px] border-[1.5px] border-ink bg-paper pb-[3px] text-xl text-ink transition-transform active:scale-95"
        >
          ‹
        </button>
        <div className="flex-1 font-meta text-[13px] font-bold uppercase tracking-[0.14em] text-muted">
          My week
        </div>
      </div>

      {landscape ? (
        <div className="flex min-h-0 flex-1">
          <div className="shrink-0 grow-0 basis-[47%] overflow-y-auto border-r-[1.5px] border-hairline">
            {header}
            {weekPicker}
            {calendar}
            {hero}
            {celebrations}
            {footer}
          </div>
          <div className="flex-1 overflow-y-auto">{taskList}</div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {header}
          {weekPicker}
          {calendar}
          {hero}
          {celebrations}
          {taskList}
          {footer}
        </div>
      )}

      {redeemOpen && (
        <RedeemSheet
          left={view.left}
          sel={redeemSel}
          setSel={setRedeemSel}
          onClose={() => setRedeemOpen(false)}
          onConfirm={() => {
            const amount = redeemSel;
            setRedeemOpen(false);
            startTransition(async () => {
              await redeemMinutes(view.kidId, amount);
            });
          }}
        />
      )}

      {tokenConfirmOpen && (
        <ConfirmSheet
          title="Use a celebration?"
          body={`You have ${view.celebrationTokens}. This token will be used up.`}
          confirmLabel="Yes, celebrate!"
          onClose={() => setTokenConfirmOpen(false)}
          onConfirm={confirmRedeemToken}
        />
      )}

      {view.celebration && !celebrated && (
        <Celebration
          variant="earn"
          who={view.celebration.who}
          mins={view.celebration.mins}
          task={view.celebration.task}
          onDismiss={dismissCelebration}
        />
      )}

      {tokenCelebrate && (
        <Celebration
          variant="token"
          who={view.kidName}
          onDismiss={() => setTokenCelebrate(false)}
        />
      )}
    </div>
  );
}

function NavButton({
  dir,
  enabled,
  onClick,
}: {
  dir: "prev" | "next";
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? "Previous week" : "Next week"}
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] bg-paper pb-[3px] text-[22px]",
        enabled
          ? "border-ink text-ink transition-transform active:scale-95"
          : "cursor-default border-disabled text-faint2",
      )}
    >
      {dir === "prev" ? "‹" : "›"}
    </button>
  );
}

const DAY_CLASSES: Record<DayCell["st"], { wrap: string; w: string; n: string }> = {
  muted: { wrap: "", w: "text-faint2", n: "text-faint2" },
  none: { wrap: "", w: "text-[#B7AE9D]", n: "text-[#8A8270]" },
  ahead: { wrap: "", w: "text-[#C2BAAA]", n: "text-[#A89E8B]" },
  done: { wrap: "", w: "text-[#A89E8B]", n: "text-ink" },
  today: {
    wrap: "bg-paper shadow-[inset_0_0_0_2px_#1A1510]",
    w: "text-[#A89E8B]",
    n: "text-ink",
  },
  todayDone: { wrap: "bg-ink", w: "text-[#C9BEB0]", n: "text-white" },
};

function DayCellEl({ cell }: { cell: DayCell }) {
  const c = DAY_CLASSES[cell.st];
  const showDot = cell.st === "done" || cell.st === "todayDone";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[9px] py-2",
        c.wrap,
      )}
    >
      <span className={cn("font-meta text-[10px] font-extrabold", c.w)}>{cell.w}</span>
      <span className={cn("mt-0.5 text-[15px] font-bold", c.n)}>{cell.n}</span>
      <span
        className={cn(
          "mt-[5px] rounded-full",
          showDot ? "h-[7px] w-[7px] bg-accent" : "h-1.5 w-1.5 bg-transparent",
        )}
      />
    </div>
  );
}

function TaskRow({
  task,
  view,
  onDidIt,
}: {
  task: TaskView;
  view: KidWeekView;
  onDidIt: (id: string) => void;
}) {
  let action: React.ReactNode = null;
  if (task.earned) {
    action = (
      <span className="flex shrink-0 items-center gap-1.5 font-meta text-[12.5px] font-extrabold text-success">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-success text-sm text-white">
          ✓
        </span>
        +{task.reward}
      </span>
    );
  } else if (!view.isPast && task.pending > 0) {
    action = (
      <span className="shrink-0 whitespace-nowrap rounded-full bg-accent-tint px-[11px] py-1.5 font-meta text-xs font-extrabold text-accent">
        checking
      </span>
    );
  } else if (!view.isPast) {
    action = (
      <button
        type="button"
        onClick={() => onDidIt(task.id)}
        className="shrink-0 rounded-lg bg-ink px-[15px] py-[11px] text-[13px] font-bold text-white transition-transform active:scale-95"
      >
        I did it
      </button>
    );
  } else if (view.isPast) {
    action = (
      <span className="shrink-0 font-meta text-xs font-extrabold text-faint">
        not finished
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3.5 border-b border-hairline py-[17px]">
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px]",
          task.earned ? "bg-success-tint" : "bg-tile",
        )}
      >
        <TaskIllustration kind={task.kind} size={30} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[17px] font-semibold">{task.title}</div>
        {task.display === "tally" ? (
          <div className="mt-[7px] flex gap-1.5">
            {task.dots.map((d, i) => (
              <span
                key={i}
                className={cn(
                  "h-4 w-4 rounded-[5px]",
                  d === "on"
                    ? "bg-ink"
                    : d === "pend"
                      ? "border-[1.5px] border-dashed border-accent"
                      : "border-[1.5px] border-dashed border-[#D8CDBA]",
                )}
              />
            ))}
          </div>
        ) : (
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-track">
            <div
              className="h-full rounded-full bg-ink transition-[width] duration-300 ease-out"
              style={{ width: `${task.barPct}%` }}
            />
          </div>
        )}
      </div>
      {action}
    </div>
  );
}

function RedeemSheet({
  left,
  sel,
  setSel,
  onClose,
  onConfirm,
}: {
  left: number;
  sel: number;
  setSel: (n: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-30 flex items-end justify-center bg-[rgba(26,21,16,0.4)]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[640px] rounded-t-[22px] bg-paper px-[26px] pb-[30px] pt-6 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
      >
        <div className="text-xl font-bold tracking-[-0.01em]">Use screen time</div>
        <div className="mb-4 mt-0.5 font-meta text-[13px] font-bold text-muted">
          {left} mins available
        </div>
        <div className="mb-3.5 flex gap-2">
          {[15, 30, 60].map((m) => {
            const bad = m > left;
            const active = sel === m;
            return (
              <button
                key={m}
                type="button"
                disabled={bad}
                onClick={() => setSel(m)}
                className={cn(
                  "h-[50px] flex-1 rounded-[11px] border-[1.5px] text-base font-bold",
                  bad
                    ? "cursor-not-allowed border-[#EADFCB] bg-[#F0EBE1] text-faint2"
                    : active
                      ? "border-ink bg-ink text-white"
                      : "border-ink bg-paper text-ink",
                )}
              >
                {m}m
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-[50px] flex-1 rounded-[11px] border-[1.5px] border-disabled bg-paper text-[15px] font-bold text-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={left <= 0}
            onClick={onConfirm}
            className={cn(
              "h-[50px] flex-[2] rounded-[11px] text-[15px] font-bold text-white",
              left > 0 ? "bg-accent" : "cursor-not-allowed bg-faint2",
            )}
          >
            Use {sel} mins
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmSheet({
  title,
  body,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-30 flex items-end justify-center bg-[rgba(26,21,16,0.4)]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[640px] rounded-t-[22px] bg-paper px-[26px] pb-[30px] pt-6 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
      >
        <div className="text-xl font-bold tracking-[-0.01em]">{title}</div>
        <div className="mb-4 mt-0.5 font-meta text-[13px] font-bold text-muted">{body}</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-[50px] flex-1 rounded-[11px] border-[1.5px] border-disabled bg-paper text-[15px] font-bold text-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-[50px] flex-[2] rounded-[11px] bg-accent text-[15px] font-bold text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Celebration({
  variant,
  who,
  mins,
  task,
  onDismiss,
}: {
  variant: "earn" | "token";
  who: string;
  mins?: number;
  task?: string;
  onDismiss: () => void;
}) {
  const colors = ["#E8503A", "#1A1510", "#3E8E6E", "#F0B429"];
  // Deterministic confetti (index-based) to avoid SSR/hydration mismatch.
  const confetti = Array.from({ length: 16 }, (_, i) => {
    const leftPct = (i * 61) % 100;
    const round = i % 2 === 0;
    const dur = 1.8 + ((i * 7) % 16) / 10;
    const delay = ((i * 5) % 6) / 10;
    return (
      <span
        key={i}
        style={{
          position: "absolute",
          top: "-20px",
          left: `${leftPct}%`,
          width: "9px",
          height: round ? "9px" : "14px",
          background: colors[i % 4],
          borderRadius: round ? "999px" : "2px",
          animation: `fos-fall ${dur}s linear ${delay}s infinite`,
        }}
      />
    );
  });

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg,#E8503AF2,#E8503AE0)" }}
    >
      <div className="pointer-events-none absolute inset-0">{confetti}</div>
      <div className="fos-pop relative rounded-[22px] bg-paper px-10 py-9 text-center shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
        {variant === "token" ? (
          <>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              {who} unlocked
            </div>
            <div className="my-1.5 text-[88px] leading-none">🎉</div>
            <div className="text-lg font-bold">A celebration!</div>
            <div className="mt-1 font-meta text-[13px] font-bold text-muted">
              Go enjoy your treat
            </div>
          </>
        ) : (
          <>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              {who} earned
            </div>
            <div className="my-1.5 text-[88px] font-bold leading-none tracking-[-0.04em] text-accent">
              +{mins}
            </div>
            <div className="text-lg font-bold">minutes of screen time</div>
            <div className="mt-1 font-meta text-[13px] font-bold text-muted">
              {task} complete
            </div>
          </>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="mt-[22px] h-12 rounded-xl bg-ink px-[34px] text-base font-bold text-white"
        >
          Nice!
        </button>
      </div>
    </div>
  );
}
