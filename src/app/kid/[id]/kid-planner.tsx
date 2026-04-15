"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

type Task = {
  id: string;
  title: string;
  emoji: string;
  durationMins: number;
  status: string;
  points: number;
  video: { id: string; filePath: string } | null;
};

type Reward = {
  id: string;
  title: string;
  emoji: string;
  pointsCost: number;
};

const EMOJI_OPTIONS = [
  "🥁", "📚", "🎹", "✏️", "🛏️", "🏃",
  "🎨", "🧹", "🐕", "🍳", "🧘", "💪",
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDayLabel(dateStr: string, today: string): string {
  if (dateStr === today) return "Today";
  const tomorrow = new Date(today + "T00:00:00");
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === tomorrow.toISOString().split("T")[0]) return "Tmrw";
  const d = new Date(dateStr + "T00:00:00");
  return DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

function formatDateNum(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").getDate().toString();
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function KidPlanner({
  kidId,
  initialTasks,
  rewards,
  pointBalance,
  selectedDate,
  today,
  weekDates,
  taskCountByDate,
}: {
  kidId: string;
  initialTasks: Task[];
  rewards: Reward[];
  pointBalance: number;
  selectedDate: string;
  today: string;
  weekDates: string[];
  taskCountByDate: Record<string, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [tasks] = useState<Task[]>(initialTasks);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newEmoji, setNewEmoji] = useState("✅");
  const [newDuration, setNewDuration] = useState(15);
  const [recording, setRecording] = useState<string | null>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mimeTypeRef = useRef<string>("video/webm");
  const chunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isPast = selectedDate < today;

  const navigateToDate = (date: string) => {
    router.push(`${pathname}?date=${date}`);
  };

  const goToPrevWeek = () => {
    const d = new Date(weekDates[0] + "T00:00:00");
    d.setDate(d.getDate() - 7);
    navigateToDate(d.toISOString().split("T")[0]);
  };

  const goToNextWeek = () => {
    const d = new Date(weekDates[0] + "T00:00:00");
    d.setDate(d.getDate() + 7);
    navigateToDate(d.toISOString().split("T")[0]);
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kidId,
        title: newTitle,
        emoji: newEmoji,
        durationMins: newDuration,
        date: selectedDate,
      }),
    });
    if (res.ok) {
      setNewTitle("");
      setNewEmoji("✅");
      setNewDuration(15);
      setShowAdd(false);
      router.refresh();
    }
  };

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    router.refresh();
  };

  const startRecording = useCallback(async (taskId: string) => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;

      // Detect best supported mime type (Safari only supports mp4)
      let mimeType = "";
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
        mimeType = "video/webm;codecs=vp9";
      } else if (MediaRecorder.isTypeSupported("video/webm")) {
        mimeType = "video/webm";
      } else if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
      }

      const options: MediaRecorderOptions = {};
      if (mimeType) options.mimeType = mimeType;
      mimeTypeRef.current = mimeType || "video/webm";

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(1000);
      setRecording(taskId);

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (err) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser settings."
          : "Could not start recording. Your browser may not support video recording.";
      setError(msg);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !recording) return;

    setUploading(true);
    setError(null);

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Recording stop timed out")), 10000);

        mediaRecorderRef.current!.onstop = async () => {
          clearTimeout(timeout);
          try {
            const mimeType = mimeTypeRef.current;
            const ext = mimeType.includes("mp4") ? "mp4" : "webm";
            const blob = new Blob(chunksRef.current, { type: mimeType });
            await uploadVideo(blob, recording, ext);
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        mediaRecorderRef.current!.stop();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setRecording(null);
      setUploading(false);
      router.refresh();
    }
  }, [recording, router]);

  const uploadVideo = async (blob: Blob, taskId: string, ext: string) => {
    const formData = new FormData();
    formData.append("video", blob, `recording.${ext}`);
    formData.append("taskId", taskId);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Upload failed");
    }
  };

  const handleFileUpload = async (taskId: string, file: File) => {
    setError(null);

    if (file.size > 50 * 1024 * 1024) {
      setError("Video is too large. Maximum size is 50MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("taskId", taskId);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      router.refresh();
    }
  };

  const claimReward = async (rewardId: string) => {
    setError(null);
    try {
      const res = await fetch("/api/rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId, rewardId }),
      });
      if (res.ok) {
        router.refresh();
        setShowRewards(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not claim reward");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  const totalPlannedMins = tasks.reduce((s, t) => s + t.durationMins, 0);
  const doneTasks = tasks.filter((t) => t.status !== "PLANNED");

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Error banner */}
      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <span className="flex-1 text-sm md:text-base">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400/60 hover:text-red-400 text-lg"
          >
            ✕
          </button>
        </div>
      )}

      {/* Week strip date picker */}
      <div className="glass rounded-2xl md:rounded-3xl p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPrevWeek}
            className="text-muted hover:text-white p-2 rounded-xl active:bg-white/5 text-xl md:text-2xl transition-colors"
          >
            &larr;
          </button>
          <span className="font-semibold text-base md:text-lg text-slate-300">
            {formatMonthYear(selectedDate)}
          </span>
          <button
            onClick={goToNextWeek}
            className="text-muted hover:text-white p-2 rounded-xl active:bg-white/5 text-xl md:text-2xl transition-colors"
          >
            &rarr;
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {weekDates.map((d) => {
            const isSelected = d === selectedDate;
            const isToday = d === today;
            const count = taskCountByDate[d] || 0;
            return (
              <button
                key={d}
                onClick={() => navigateToDate(d)}
                className={`flex flex-col items-center py-2 md:py-3 rounded-xl md:rounded-2xl transition active:scale-95 ${
                  isSelected
                    ? "bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                    : isToday
                      ? "bg-white/10 text-amber-400 ring-1 ring-amber-500/50"
                      : "hover:bg-white/5 text-slate-400"
                }`}
              >
                <span
                  className={`text-xs md:text-sm font-medium ${
                    isSelected ? "text-white/80" : ""
                  }`}
                >
                  {formatDayLabel(d, today)}
                </span>
                <span
                  className={`text-lg md:text-2xl font-bold ${
                    isSelected ? "text-white" : ""
                  }`}
                >
                  {formatDateNum(d)}
                </span>
                {count > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
                          isSelected ? "bg-white/70" : "bg-amber-400/70"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {selectedDate !== today && (
          <button
            onClick={() => navigateToDate(today)}
            className="w-full mt-3 text-sm md:text-base text-amber-400 font-medium hover:text-amber-300 active:scale-[0.98] transition"
          >
            Jump to today
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="glass rounded-2xl md:rounded-3xl p-5 md:p-6">
        <div className="flex justify-between text-sm md:text-base text-muted mb-3">
          <span>
            {doneTasks.length} of {tasks.length} tasks done
          </span>
          <span>{totalPlannedMins} min planned</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-4 md:h-5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-4 md:h-5 rounded-full transition-all duration-500 shadow-lg shadow-emerald-500/30"
            style={{
              width: tasks.length
                ? `${(doneTasks.length / tasks.length) * 100}%`
                : "0%",
            }}
          />
        </div>
      </div>

      {/* Recording overlay */}
      {recording && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6">
          <div className="glass rounded-3xl p-8 w-full max-w-lg border border-red-500/30">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <h3 className="text-2xl md:text-3xl font-bold">Recording</h3>
            </div>
            <video
              ref={videoPreviewRef}
              autoPlay
              muted
              playsInline
              className="w-full aspect-video rounded-2xl bg-black mb-6 ring-1 ring-white/10"
            />
            <button
              onClick={stopRecording}
              disabled={uploading}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-4 md:py-5 rounded-2xl font-bold text-lg md:text-xl hover:from-red-400 hover:to-pink-400 transition active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-red-500/30"
            >
              {uploading ? "Uploading..." : "Stop & Submit"}
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`glass rounded-2xl md:rounded-3xl p-5 md:p-6 transition-all ${
              task.status === "APPROVED"
                ? "border-emerald-500/40 bg-emerald-500/10 glow-green"
                : task.status === "DONE"
                  ? "border-amber-500/40 bg-amber-500/10 glow-amber"
                  : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl md:text-5xl">{task.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg md:text-xl truncate">
                  {task.title}
                </div>
                <div className="text-sm md:text-base text-muted">
                  {task.durationMins} min &middot; {task.points} pts
                </div>
              </div>
              {task.status === "APPROVED" && (
                <span className="text-emerald-400 font-bold text-sm md:text-base bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-full whitespace-nowrap">
                  Approved!
                </span>
              )}
              {task.status === "DONE" && (
                <span className="text-amber-400 font-bold text-sm md:text-base bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-full whitespace-nowrap">
                  Pending
                </span>
              )}
            </div>

            {task.status === "PLANNED" && !isPast && (
              <div className="mt-4 flex gap-3">
                {selectedDate === today && (
                  <>
                    <button
                      onClick={() => startRecording(task.id)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 md:py-4 px-4 rounded-2xl text-base md:text-lg font-semibold hover:from-blue-400 hover:to-cyan-400 active:scale-[0.97] transition shadow-lg shadow-blue-500/20"
                    >
                      Record
                    </button>
                    <label className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 md:py-4 px-4 rounded-2xl text-base md:text-lg font-semibold hover:from-purple-400 hover:to-pink-400 active:scale-[0.97] transition cursor-pointer text-center shadow-lg shadow-purple-500/20">
                      Upload
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(task.id, f);
                        }}
                      />
                    </label>
                  </>
                )}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="bg-white/10 text-muted py-3 md:py-4 px-4 rounded-2xl text-base hover:bg-white/15 hover:text-red-400 active:scale-[0.97] transition"
                >
                  X
                </button>
              </div>
            )}

            {task.video && (
              <div className="mt-4">
                <video
                  src={task.video.filePath}
                  controls
                  playsInline
                  className="w-full rounded-2xl ring-1 ring-white/10"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="text-center py-12 md:py-16">
          <div className="text-5xl md:text-6xl mb-4">📋</div>
          <p className="text-muted text-lg md:text-xl">
            {isPast
              ? "No tasks were planned for this day"
              : "No tasks planned yet — add some!"}
          </p>
        </div>
      )}

      {/* Add task form */}
      {!isPast && (
        <>
          {showAdd ? (
            <div className="glass rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-5">
              <input
                type="text"
                placeholder="What are you going to do?"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-5 py-4 md:py-5 rounded-2xl bg-white/5 border border-white/15 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 text-xl md:text-2xl text-white placeholder-slate-500 transition"
                autoFocus
              />

              <div>
                <label className="text-base md:text-lg text-muted block mb-2 font-medium">
                  Pick an emoji
                </label>
                <div className="flex flex-wrap gap-3">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setNewEmoji(e)}
                      className={`text-3xl md:text-4xl p-2.5 md:p-3 rounded-xl transition active:scale-90 ${
                        newEmoji === e
                          ? "bg-amber-500/20 scale-110 ring-2 ring-amber-400/50"
                          : "hover:bg-white/5"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-base md:text-lg text-muted block mb-2 font-medium">
                  How long? (minutes)
                </label>
                <div className="flex flex-wrap gap-3">
                  {[5, 10, 15, 20, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => setNewDuration(m)}
                      className={`px-5 py-3 md:px-6 md:py-4 rounded-xl text-base md:text-lg font-semibold transition active:scale-95 ${
                        newDuration === m
                          ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20"
                          : "bg-white/5 hover:bg-white/10 text-slate-300"
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={addTask}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white py-4 md:py-5 rounded-2xl font-bold text-lg md:text-xl hover:from-emerald-400 hover:to-green-400 active:scale-[0.97] transition shadow-lg shadow-emerald-500/20"
                >
                  Add Task
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-6 py-4 md:py-5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.97] transition text-lg font-medium text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full glass border-dashed !border-white/20 rounded-2xl md:rounded-3xl p-5 md:p-6 text-muted hover:text-amber-400 hover:!border-amber-500/40 active:scale-[0.98] transition font-semibold text-lg md:text-xl"
            >
              + Add a task
            </button>
          )}
        </>
      )}

      {/* Rewards section */}
      <div className="pt-4 md:pt-6">
        <button
          onClick={() => setShowRewards(!showRewards)}
          className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white rounded-2xl md:rounded-3xl p-5 md:p-6 font-bold text-xl md:text-2xl hover:from-violet-500 hover:via-purple-500 hover:to-pink-500 active:scale-[0.98] transition shadow-lg shadow-purple-500/25"
        >
          🎁 Spend Points ({pointBalance} pts available)
        </button>

        {showRewards && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="glass rounded-2xl p-4 md:p-5 flex items-center gap-4"
              >
                <span className="text-3xl md:text-4xl">{reward.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base md:text-lg truncate">
                    {reward.title}
                  </div>
                  <div className="text-sm md:text-base text-muted">
                    {reward.pointsCost} pts
                  </div>
                </div>
                <button
                  onClick={() => claimReward(reward.id)}
                  disabled={pointBalance < reward.pointsCost}
                  className="bg-gradient-to-r from-violet-500 to-purple-500 text-white px-5 py-3 md:px-6 md:py-3 rounded-xl text-base md:text-lg font-semibold hover:from-violet-400 hover:to-purple-400 active:scale-95 transition disabled:opacity-20 disabled:cursor-not-allowed whitespace-nowrap shadow-lg shadow-purple-500/20"
                >
                  Claim
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
