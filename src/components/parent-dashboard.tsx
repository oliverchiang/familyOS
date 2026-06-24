"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addCelebration,
  adjustMinutes,
  approveCompletion,
  markCelebrationUsed,
  rejectCompletion,
  unapproveCompletion,
} from "@/app/actions";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/cn";
import type { HistoryItem, ParentDeskView, ParentKidSummary, QueueItem } from "@/lib/types";
import { Avatar, TaskIllustration } from "./illustrations";

export function ParentDashboard({ view }: { view: ParentDeskView }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const wide = useMediaQuery("(min-width: 880px)");

  const act = (fn: () => Promise<void>) => startTransition(async () => void (await fn()));

  const header = (
    <div className="mb-1.5 flex items-center gap-[13px]">
      <div className="shrink-0">
        <Avatar who="mum" size={46} />
      </div>
      <div className="flex-1">
        <div className="text-2xl font-bold tracking-[-0.01em]">Mum’s desk</div>
        <div className="font-meta text-[13px] font-bold text-muted">
          This week · {view.weekLabel}
        </div>
      </div>
    </div>
  );

  const queueSection = (
    <section>
      <Label>To check{view.queue.length ? ` · ${view.queue.length}` : ""}</Label>
      {view.queue.length === 0 ? (
        <div className="p-[26px] text-center font-meta text-sm font-bold text-faint">
          Nothing to check right now
        </div>
      ) : (
        view.queue.map((q) => (
          <QueueRow
            key={q.completionId}
            item={q}
            onApprove={() => act(() => approveCompletion(q.completionId))}
            onReject={() => act(() => rejectCompletion(q.completionId))}
          />
        ))
      )}
    </section>
  );

  const weekSection = (
    <section>
      <Label>This week</Label>
      {view.kids.map((k) => (
        <KidSummary
          key={k.kidId}
          kid={k}
          onAdjust={(delta) => act(() => adjustMinutes(k.kidId, delta))}
          onAddCelebration={(note) => act(() => addCelebration(k.kidId, note))}
          onCelebrationUsed={(id) => act(() => markCelebrationUsed(id))}
        />
      ))}
    </section>
  );

  const histSection = (
    <section>
      <Label>Recent</Label>
      {view.history.map((h, i) => (
        <HistoryRow
          key={i}
          item={h}
          onUndo={
            h.kind === "approval" && h.completionId
              ? () => act(() => unapproveCompletion(h.completionId!))
              : undefined
          }
        />
      ))}
    </section>
  );

  return (
    <div className="mx-auto flex h-dvh w-full flex-col overflow-hidden bg-paper min-[880px]:max-w-[1120px]">
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
          Parent
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-tint px-3 py-[7px] font-meta text-xs font-extrabold text-success">
          Unlocked
        </span>
      </div>

      {wide ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-8 pt-1.5">{header}</div>
          <div className="flex min-h-0 flex-1 gap-8 px-8 pb-7 pt-1">
            <div className="flex-1 overflow-y-auto">
              {queueSection}
              {histSection}
            </div>
            <div className="flex-1 overflow-y-auto border-l-[1.5px] border-hairline pl-8">
              {weekSection}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-[26px] pb-7 pt-1">
          {header}
          {queueSection}
          {weekSection}
          {histSection}
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-0.5 mt-[18px] text-xs font-bold uppercase tracking-[0.14em] text-muted">
      {children}
    </div>
  );
}

function QueueRow({
  item,
  onApprove,
  onReject,
}: {
  item: QueueItem;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex items-center gap-[13px] border-b border-hairline py-[13px]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tile">
        <TaskIllustration kind={item.kind} size={28} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold">
          {item.kidName} · {item.taskTitle}
        </div>
        <div className="font-meta text-[12.5px] font-bold text-muted">
          +{item.reward} mins when finished
        </div>
      </div>
      <button
        type="button"
        onClick={onReject}
        aria-label="Reject"
        className="h-10 w-10 shrink-0 rounded-[10px] border-[1.5px] border-disabled bg-paper text-[17px] text-faint transition-transform active:scale-95"
      >
        ✕
      </button>
      <button
        type="button"
        onClick={onApprove}
        className="h-10 shrink-0 rounded-[10px] bg-success px-4 text-sm font-bold text-white transition-transform active:scale-95"
      >
        Approve
      </button>
    </div>
  );
}

function KidSummary({
  kid,
  onAdjust,
  onAddCelebration,
  onCelebrationUsed,
}: {
  kid: ParentKidSummary;
  onAdjust: (delta: number) => void;
  onAddCelebration: (note: string) => void;
  onCelebrationUsed: (id: string) => void;
}) {
  const [note, setNote] = useState("");
  const canAdd = note.trim().length > 0;
  function add() {
    if (!canAdd) return;
    onAddCelebration(note.trim());
    setNote("");
  }
  return (
    <div className="border-b border-hairline py-4">
      <div className="mb-3 flex items-center gap-[11px]">
        <div className="shrink-0">
          <Avatar who={kid.avatarKey} size={36} />
        </div>
        <div className="flex-1 text-[17px] font-bold">{kid.name}</div>
        <div className="text-right">
          <span className="text-[22px] font-bold text-accent">{kid.gained}</span>
          <span className="font-meta text-xs font-extrabold text-muted"> gained</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {kid.tasks.map((t) => (
          <div key={t.id} className="flex items-center gap-2.5">
            <div className="shrink-0">
              <TaskIllustration kind={t.kind} size={20} />
            </div>
            <div className="flex-1">
              <div className="mb-[3px] flex justify-between font-meta text-[12.5px] font-bold text-[#6B665D]">
                <span>{t.title}</span>
                <span className={t.earned ? "text-success" : "text-faint"}>
                  {t.earned ? `✓ +${t.reward}` : `${t.approved}/${t.target}`}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-track">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300 ease-out",
                    t.earned ? "bg-success" : "bg-ink",
                  )}
                  style={{ width: `${t.barPct}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-[13px] flex gap-2">
        <button
          type="button"
          onClick={() => onAdjust(15)}
          className="h-9 flex-1 rounded-[9px] border-[1.5px] border-ink bg-paper text-[13px] font-bold text-ink transition-transform active:scale-95"
        >
          +15 min
        </button>
        <button
          type="button"
          onClick={() => onAdjust(-15)}
          className="h-9 flex-1 rounded-[9px] border-[1.5px] border-disabled bg-paper text-[13px] font-bold text-muted transition-transform active:scale-95"
        >
          −15 min
        </button>
      </div>
      <div className="mt-[15px]">
        <div className="mb-1.5 font-meta text-[12px] font-bold uppercase tracking-[0.1em] text-muted">
          🎉 Celebrations
        </div>
        {kid.celebrations.map((c) => (
          <div key={c.id} className="flex items-center gap-2 py-1">
            <div className="min-w-0 flex-1 truncate text-[14px] font-semibold">{c.note}</div>
            <button
              type="button"
              onClick={() => onCelebrationUsed(c.id)}
              className="h-8 shrink-0 rounded-[9px] border-[1.5px] border-ink bg-paper px-3 text-[12.5px] font-bold text-ink transition-transform active:scale-95"
            >
              Used
            </button>
          </div>
        ))}
        <div className="mt-1.5 flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="What's the celebration for?"
            className="h-9 min-w-0 flex-1 rounded-[9px] border-[1.5px] border-hairline bg-paper px-3 text-[13px] font-semibold text-ink outline-none placeholder:text-faint focus:border-ink"
          />
          <button
            type="button"
            onClick={add}
            disabled={!canAdd}
            className="h-9 shrink-0 rounded-[9px] border-[1.5px] border-ink bg-paper px-3 text-[13px] font-bold text-ink transition-transform active:scale-95 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryRow({ item, onUndo }: { item: HistoryItem; onUndo?: () => void }) {
  const color =
    item.kind === "earn"
      ? "text-success"
      : item.kind === "token"
        ? "text-accent"
        : item.kind === "redeem"
          ? "text-ink"
          : "text-muted";
  const sign = item.amount >= 0 ? "+" : "−";
  const value =
    item.unit === "token"
      ? `${sign}${Math.abs(item.amount)} 🎉`
      : `${sign}${Math.abs(item.amount)}m`;
  return (
    <div className="flex items-center gap-3 border-b border-hairline py-2.5">
      <div className="flex-1">
        <div className="text-sm font-semibold">
          {item.who} · {item.text}
        </div>
        <div className="font-meta text-xs font-bold text-faint">{item.time}</div>
      </div>
      {item.kind === "approval" ? (
        onUndo ? (
          <button
            type="button"
            onClick={onUndo}
            className="h-8 shrink-0 rounded-[9px] border-[1.5px] border-disabled bg-paper px-3 text-[12.5px] font-bold text-muted transition-transform active:scale-95"
          >
            Undo
          </button>
        ) : null
      ) : (
        <div className={cn("font-meta text-[15px] font-extrabold", color)}>{value}</div>
      )}
    </div>
  );
}
