import type { IconName } from "@/lib/types";

type IconProps = { className?: string };

// Line-art task icons. All use currentColor so the tile sets the ink color.
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function DrumsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <ellipse cx="12" cy="9" rx="7" ry="2.8" {...stroke} />
      <path d="M5 9v4.6c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8V9" {...stroke} />
      <path d="M6.4 10.4l2.6 2.8M17.6 10.4l-2.6 2.8" {...stroke} />
      <path d="M2.5 5.5l5.5 4.2M21.5 5.5L16 9.7" {...stroke} />
    </svg>
  );
}

function GuitarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M9.5 13.2a3.4 3.4 0 1 0 3.3 4 2.6 2.6 0 0 1 1.6-3.6 2.7 2.7 0 1 0-1.5-3.4 3.4 3.4 0 0 0-3.4 3z"
        {...stroke}
      />
      <path d="M14.8 9.6l4.2-4.2a1.4 1.4 0 0 1 2 2l-4.2 4.2" {...stroke} />
      <circle cx="9.6" cy="16.6" r="1.1" {...stroke} />
    </svg>
  );
}

function BookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 6.6C10.4 5.4 8.3 4.9 4 5.2v12.4c4.3-.3 6.4.2 8 1.4 1.6-1.2 3.7-1.7 8-1.4V5.2c-4.3-.3-6.4.2-8 1.4z"
        {...stroke}
      />
      <path d="M12 6.6v12.4" {...stroke} />
    </svg>
  );
}

function PencilIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 20l1.4-4.4L15.4 5.6a2 2 0 0 1 2.9 2.8L8.4 18.6 4 20z" {...stroke} />
      <path d="M13.6 7.4l3 3" {...stroke} />
    </svg>
  );
}

const TASK_ICONS: Record<IconName, (p: IconProps) => React.ReactElement> = {
  drums: DrumsIcon,
  guitar: GuitarIcon,
  book: BookIcon,
  pencil: PencilIcon,
};

export function TaskIcon({ name, className }: { name: IconName; className?: string }) {
  const Cmp = TASK_ICONS[name];
  return <Cmp className={className} />;
}

export function ChevronLeft({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M14.5 6l-6 6 6 6" {...stroke} strokeWidth={2.2} />
    </svg>
  );
}

export function ChevronRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M9.5 6l6 6-6 6" {...stroke} strokeWidth={2.2} />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" {...stroke} strokeWidth={2.6} />
    </svg>
  );
}

export function ArrowRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 12h15M13 6l6 6-6 6" {...stroke} strokeWidth={2.2} />
    </svg>
  );
}

/** Friendly avatar — dark silhouette with peach features on a peach disc. */
export function Avatar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="24" className="fill-peach" />
      <circle cx="24" cy="20" r="8.2" className="fill-ink" />
      <path d="M9.5 42c0-7 6.2-11.5 14.5-11.5S38.5 35 38.5 42z" className="fill-ink" />
      <circle cx="20.9" cy="19.4" r="1.25" className="fill-peach" />
      <circle cx="27.1" cy="19.4" r="1.25" className="fill-peach" />
      <path
        d="M20.8 23c1.9 1.6 4.5 1.6 6.4 0"
        fill="none"
        stroke="var(--color-peach)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}
