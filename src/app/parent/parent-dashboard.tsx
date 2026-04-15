"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

type Kid = { id: string; name: string; avatar: string };
type Task = {
  id: string;
  title: string;
  emoji: string;
  durationMins: number;
  status: string;
  points: number;
  kidId: string;
  kid: Kid;
  video: { id: string; filePath: string } | null;
};
type Claim = {
  id: string;
  claimedAt: string;
  kid: Kid;
  reward: { title: string; emoji: string; pointsCost: number };
};

function formatDisplayDate(dateStr: string, today: string): string {
  if (dateStr === today) return "Today";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function ParentDashboard({
  kids,
  tasks,
  recentClaims,
  selectedDate,
  today,
}: {
  kids: Kid[];
  tasks: Task[];
  recentClaims: Claim[];
  selectedDate: string;
  today: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);

  const navigateToDate = (date: string) => {
    router.push(`${pathname}?date=${date}`);
  };

  const goDay = (offset: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + offset);
    navigateToDate(d.toISOString().split("T")[0]);
  };

  const approveTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    router.refresh();
  };

  const rejectTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PLANNED" }),
    });
    router.refresh();
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Date navigator */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => goDay(-1)}
            className="text-muted hover:text-white p-2 rounded-xl active:bg-white/5 text-xl transition-colors"
          >
            &larr;
          </button>
          <div className="text-center">
            <div className="font-bold text-lg">
              {formatDisplayDate(selectedDate, today)}
            </div>
            <div className="text-sm text-muted">{selectedDate}</div>
          </div>
          <button
            onClick={() => goDay(1)}
            className="text-muted hover:text-white p-2 rounded-xl active:bg-white/5 text-xl transition-colors"
          >
            &rarr;
          </button>
        </div>
        {selectedDate !== today && (
          <button
            onClick={() => navigateToDate(today)}
            className="w-full mt-2 text-sm text-amber-400 font-medium hover:text-amber-300 transition"
          >
            Jump to today
          </button>
        )}
      </div>

      {/* Kids */}
      {kids.map((kid) => {
        const kidTasks = tasks.filter((t) => t.kidId === kid.id);
        const done = kidTasks.filter((t) => t.status !== "PLANNED").length;
        const needsReview = kidTasks.filter((t) => t.status === "DONE");

        return (
          <div key={kid.id} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{kid.avatar}</span>
              <div>
                <h2 className="text-xl font-bold">{kid.name}</h2>
                <p className="text-sm text-muted">
                  {done}/{kidTasks.length} tasks done
                </p>
              </div>
              {needsReview.length > 0 && (
                <span className="ml-auto bg-red-500/15 border border-red-500/30 text-red-400 px-3 py-1 rounded-full text-sm font-semibold">
                  {needsReview.length} to review
                </span>
              )}
            </div>

            {/* Progress */}
            <div className="w-full bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-2 rounded-full transition-all shadow-sm shadow-emerald-500/30"
                style={{
                  width: kidTasks.length
                    ? `${(done / kidTasks.length) * 100}%`
                    : "0%",
                }}
              />
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {kidTasks.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-xl p-3 border transition-all ${
                    task.status === "APPROVED"
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : task.status === "DONE"
                        ? "border-amber-500/30 bg-amber-500/10"
                        : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{task.emoji}</span>
                    <span className="font-medium flex-1">{task.title}</span>
                    <span className="text-sm text-muted">
                      {task.durationMins}m &middot; {task.points}pts
                    </span>
                  </div>

                  {task.status === "DONE" && (
                    <div className="mt-3">
                      {task.video && (
                        <div className="mb-3">
                          <button
                            onClick={() =>
                              setExpandedVideo(
                                expandedVideo === task.id ? null : task.id
                              )
                            }
                            className="text-sm text-blue-400 hover:text-blue-300 font-medium transition"
                          >
                            {expandedVideo === task.id
                              ? "Hide video"
                              : "Watch video proof"}
                          </button>
                          {expandedVideo === task.id && (
                            <video
                              src={task.video.filePath}
                              controls
                              playsInline
                              className="w-full rounded-xl mt-2 ring-1 ring-white/10"
                            />
                          )}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveTask(task.id)}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white py-2 rounded-lg font-medium hover:from-emerald-400 hover:to-green-400 transition text-sm shadow-lg shadow-emerald-500/20"
                        >
                          Approve (+{task.points} pts)
                        </button>
                        <button
                          onClick={() => rejectTask(task.id)}
                          className="bg-white/10 text-slate-300 py-2 px-4 rounded-lg hover:bg-white/15 transition text-sm"
                        >
                          Redo
                        </button>
                      </div>
                    </div>
                  )}

                  {task.status === "APPROVED" && (
                    <div className="mt-2 text-emerald-400 text-sm font-medium">
                      Approved!
                    </div>
                  )}
                </div>
              ))}

              {kidTasks.length === 0 && (
                <p className="text-muted text-sm text-center py-4">
                  No tasks planned for this day
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Recent reward claims */}
      {recentClaims.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h2 className="text-xl font-bold mb-4">Recent Rewards Claimed</h2>
          <div className="space-y-2">
            {recentClaims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-center gap-3 text-sm p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20"
              >
                <span className="text-xl">{claim.reward.emoji}</span>
                <span className="flex-1">
                  <strong>{claim.kid.name}</strong> claimed{" "}
                  <strong>{claim.reward.title}</strong>
                </span>
                <span className="text-purple-400 font-medium">
                  -{claim.reward.pointsCost} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
