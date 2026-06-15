"use client";

import { useState, useTransition } from "react";
import { verifyPin } from "@/app/actions";
import { cn } from "@/lib/cn";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "<"];

export function PinGate({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [entry, setEntry] = useState("");
  const [error, setError] = useState(false);
  const [, startTransition] = useTransition();

  if (!open) return null;

  function submit(pin: string) {
    startTransition(async () => {
      const { ok } = await verifyPin(pin);
      if (ok) {
        setEntry("");
        setError(false);
        onSuccess();
      } else {
        setEntry("");
        setError(true);
      }
    });
  }

  function press(d: string) {
    if (entry.length >= 4) return;
    const next = entry + d;
    setError(false);
    setEntry(next);
    if (next.length === 4) submit(next);
  }

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-40 flex items-center justify-center bg-[rgba(26,21,16,0.45)] p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[300px] rounded-[20px] bg-paper p-7 text-center shadow-[0_24px_60px_rgba(0,0,0,0.3)]"
      >
        <div className="text-[19px] font-bold">Parent PIN</div>
        <div className="mt-0.5 font-meta text-[13px] font-bold text-muted">
          Enter 1234 to approve
        </div>

        <div className="my-[18px] flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-3.5 w-3.5 rounded-full",
                i < entry.length ? "bg-ink" : "bg-disabled",
              )}
            />
          ))}
        </div>

        {error && (
          <div className="mb-2.5 font-meta text-[13px] font-extrabold text-accent">
            Try again
          </div>
        )}

        <div className="grid grid-cols-3 gap-2.5">
          {KEYS.map((k, i) =>
            k === "" ? (
              <span key={i} />
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => (k === "<" ? setEntry((e) => e.slice(0, -1)) : press(k))}
                className="h-[54px] rounded-xl border-[1.5px] border-hairline bg-paper text-[22px] font-bold text-ink transition-transform active:scale-95"
              >
                {k === "<" ? "⌫" : k}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
