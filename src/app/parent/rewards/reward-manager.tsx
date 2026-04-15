"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Reward = {
  id: string;
  title: string;
  emoji: string;
  pointsCost: number;
};

const REWARD_EMOJIS = ["📺", "🍦", "🎮", "🌙", "🍕", "🎬", "🏊", "🎁", "🧸", "🍫"];

export default function RewardManager({
  initialRewards,
}: {
  initialRewards: Reward[];
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎁");
  const [cost, setCost] = useState(20);

  const addReward = async () => {
    if (!title.trim()) return;
    const res = await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, emoji, pointsCost: cost }),
    });
    if (res.ok) {
      setTitle("");
      setEmoji("🎁");
      setCost(20);
      setShowAdd(false);
      router.refresh();
    }
  };

  return (
    <div className="space-y-3">
      {initialRewards.map((reward) => (
        <div
          key={reward.id}
          className="glass rounded-xl p-4 flex items-center gap-3"
        >
          <span className="text-3xl">{reward.emoji}</span>
          <div className="flex-1">
            <div className="font-semibold">{reward.title}</div>
            <div className="text-sm text-muted">{reward.pointsCost} points</div>
          </div>
        </div>
      ))}

      {showAdd ? (
        <div className="glass rounded-xl p-5 space-y-4">
          <input
            type="text"
            placeholder="Reward name (e.g. 30 min TV time)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 text-white placeholder-slate-500 transition"
            autoFocus
          />
          <div>
            <label className="text-sm text-muted block mb-2 font-medium">
              Emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {REWARD_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`text-2xl p-2 rounded-lg transition active:scale-90 ${
                    emoji === e
                      ? "bg-purple-500/20 scale-110 ring-2 ring-purple-400/50"
                      : "hover:bg-white/5"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted block mb-2 font-medium">
              Point cost
            </label>
            <div className="flex flex-wrap gap-2">
              {[10, 15, 20, 25, 30, 40, 50].map((c) => (
                <button
                  key={c}
                  onClick={() => setCost(c)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition active:scale-95 ${
                    cost === c
                      ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/20"
                      : "bg-white/5 hover:bg-white/10 text-slate-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addReward}
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:from-violet-400 hover:to-purple-400 transition active:scale-[0.97] shadow-lg shadow-purple-500/20"
            >
              Add Reward
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition active:scale-[0.97] text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full glass border-dashed !border-white/20 rounded-xl p-4 text-muted hover:text-purple-400 hover:!border-purple-500/40 transition font-medium"
        >
          + Add a reward
        </button>
      )}
    </div>
  );
}
