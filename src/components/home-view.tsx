"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProfileSummary } from "@/lib/types";
import { Avatar } from "./illustrations";
import { PinGate } from "./pin-gate";

export function HomeView({
  profiles,
  eyebrow,
}: {
  profiles: ProfileSummary[];
  eyebrow: string;
}) {
  const router = useRouter();
  const [pinOpen, setPinOpen] = useState(false);

  return (
    <div className="relative h-dvh overflow-hidden bg-paper">
      <div className="mx-auto flex h-full w-full max-w-none flex-col justify-start px-[26px] pb-[26px] pt-[46px] min-[880px]:max-w-[1080px] min-[880px]:justify-center min-[880px]:px-[7vw] min-[880px]:py-10">
        <div className="font-meta text-[13px] font-bold uppercase tracking-[0.14em] text-muted">
          {eyebrow}
        </div>
        <h1 className="mb-2 mt-1 text-[40px] font-bold tracking-[-0.02em] min-[880px]:text-[52px]">
          Who&rsquo;s here?
        </h1>

        <div className="mt-5 flex flex-col gap-4 min-[880px]:grid min-[880px]:grid-cols-3">
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                p.isKid ? router.push(`/kid/${p.id}`) : setPinOpen(true)
              }
              className="flex w-full items-center gap-4 rounded-[18px] border-[1.5px] border-ink bg-paper p-[18px] text-left shadow-[4px_4px_0_#1A1510] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#1A1510]"
            >
              <div className="shrink-0">
                <Avatar who={p.avatarKey} size={66} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-bold tracking-[-0.01em]">{p.name}</div>
                <div className="mt-px font-meta text-[13px] font-bold text-muted">
                  {p.roleLabel}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[30px] font-bold leading-none text-accent">
                  {p.stat}
                </div>
                <div className="mt-0.5 font-meta text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted">
                  {p.statLabel}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-6 text-center font-meta text-[13px] font-bold text-faint min-[880px]:mt-[30px]">
          A grown-up needs a PIN to approve
        </div>
      </div>

      <PinGate
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onSuccess={() => router.push("/parent")}
      />
    </div>
  );
}
