import type { AvatarKey, TaskKind } from "@/lib/types";

// Hand-drawn line illustrations ported verbatim from the design prototype
// (ink + vermilion, 48×48 viewBox). No emoji.

const INK = "#1A1510";
const ACCENT = "#E8503A";
const PAPER = "#FAF7F1";
const FACE = "#FFF6EC";
const TINT = "#FCEADF";

type IllProps = { size?: number };

const lineProps = {
  fill: "none",
  stroke: INK,
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Svg({ size = 30, children }: { size?: number; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      style={{ display: "block" }}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function Drum({ size }: IllProps) {
  return (
    <Svg size={size}>
      <g {...lineProps}>
        <path d="M17 10 l8 9 M31 9 l-8 10" />
        <circle cx="16.5" cy="9.5" r="1.9" fill={INK} stroke="none" />
        <circle cx="31.5" cy="8.5" r="1.9" fill={INK} stroke="none" />
        <ellipse cx="24" cy="22" rx="13" ry="5" fill={PAPER} />
        <path d="M11 22 v7 c0 2.8 5.8 5 13 5 s13-2.2 13-5 v-7" />
        <path d="M15 25 l3 5 M24 26 v6 M33 25 l-3 5" stroke={ACCENT} strokeWidth={2} />
      </g>
    </Svg>
  );
}

function Guitar({ size }: IllProps) {
  return (
    <Svg size={size}>
      <g {...lineProps}>
        <path d="M22 18 c2.6 0 4.4 1.8 4.4 4.2 c0 1.5 -0.7 2.7 -1.4 3.8 c2.6 1.4 4.4 4 4.4 7.1 c0 4.4 -3.4 7.4 -7.4 7.4 c-4 0 -7.4 -3 -7.4 -7.4 c0 -3.1 1.8 -5.7 4.4 -7.1 c-0.7 -1.1 -1.4 -2.3 -1.4 -3.8 c0 -2.4 1.8 -4.2 4.4 -4.2 z" fill={PAPER} />
        <path d="M22 18 L22 8" />
        <rect x="19" y="4.5" width="6" height="5" rx="1.5" fill={PAPER} />
        <circle cx="22" cy="31" r="2.6" stroke={ACCENT} strokeWidth={2} />
      </g>
    </Svg>
  );
}

function Book({ size }: IllProps) {
  return (
    <Svg size={size}>
      <g {...lineProps}>
        <path d="M24 14 c-4-3-9.5-3-13.5-1.7 v20 c4-1.3 9.5-1.3 13.5 1.7 c4-3 9.5-3 13.5-1.7 V12.3 c-4-1.3-9.5-1.3-13.5 1.7 z" fill={PAPER} />
        <path d="M24 14 v22" />
        <path d="M15 19.5 h5 M15 24.5 h5" stroke={ACCENT} strokeWidth={1.8} />
      </g>
    </Svg>
  );
}

function Pencil({ size }: IllProps) {
  return (
    <Svg size={size}>
      <g {...lineProps}>
        <path d="M14 34 l2.5-8.5 16-16 c1-1 3-1 4 0 l2 2 c1 1 1 3 0 4 l-16 16 z" fill={PAPER} />
        <path d="M30 11.5 l6 6" />
        <path d="M14 34 l2.5-8.5 4 4 z" fill={ACCENT} stroke={ACCENT} />
      </g>
    </Svg>
  );
}

const TASK_ILLUSTRATIONS: Record<TaskKind, (p: IllProps) => React.ReactElement> = {
  drum: Drum,
  guitar: Guitar,
  book: Book,
  pencil: Pencil,
};

export function TaskIllustration({ kind, size = 30 }: { kind: TaskKind; size?: number }) {
  const Cmp = TASK_ILLUSTRATIONS[kind];
  return <Cmp size={size} />;
}

// ---- Avatars (flat line portraits; hair distinguishes them) ----

function FaceBase({ blush = 0.45 }: { blush?: number }) {
  return (
    <>
      <circle cx="24" cy="25" r="12" fill={FACE} />
      <path
        d="M12.5 24 a11.5 11.5 0 0 1 23 0 c-3.5-3.6 -7.5-5 -11.5-5 s-8 1.4 -11.5 5 z"
        fill={INK}
        stroke="none"
      />
      <circle cx="20" cy="25.5" r="1.5" fill={INK} stroke="none" />
      <circle cx="28" cy="25.5" r="1.5" fill={INK} stroke="none" />
      <path d="M20.5 30 q3.5 2.5 7 0" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <circle cx="17.6" cy="29" r="1.6" fill={ACCENT} stroke="none" opacity={blush} />
      <circle cx="30.4" cy="29" r="1.6" fill={ACCENT} stroke="none" opacity={blush} />
    </>
  );
}

function Tyler() {
  return (
    <>
      <circle cx="24" cy="24" r="24" fill={TINT} stroke="none" />
      <FaceBase />
    </>
  );
}

function Riley() {
  return (
    <>
      <circle cx="24" cy="24" r="24" fill={TINT} stroke="none" />
      <circle cx="12.5" cy="22" r="3.4" fill={INK} stroke="none" />
      <circle cx="35.5" cy="22" r="3.4" fill={INK} stroke="none" />
      <FaceBase />
    </>
  );
}

function Mum() {
  return (
    <>
      <circle cx="24" cy="24" r="24" fill={TINT} stroke="none" />
      <path
        d="M11.5 34 C10.5 17 16 11 24 11 C32 11 37.5 17 36.5 34 C33 25 31 21 24 21 C17 21 15 25 11.5 34 Z"
        fill={INK}
        stroke="none"
      />
      <FaceBase blush={0.4} />
    </>
  );
}

const AVATARS: Record<AvatarKey, () => React.ReactElement> = {
  tyler: Tyler,
  riley: Riley,
  mum: Mum,
};

export function Avatar({ who, size = 46 }: { who: AvatarKey; size?: number }) {
  const Cmp = AVATARS[who];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden" }}>
      <svg viewBox="0 0 48 48" width={size} height={size} style={{ display: "block" }} aria-hidden="true">
        <Cmp />
      </svg>
    </div>
  );
}
