// Domain + view types for the "Editorial" FamilyOS app.

export type TaskKind = "drum" | "guitar" | "book" | "pencil";
export type TaskDisplay = "tally" | "bar";
export type AvatarKey = "tyler" | "riley" | "mum";

/** A week's position relative to the current week. */
export type WeekState = "past" | "current" | "future";

/** Visual state of a day cell in the calendar strip. */
export type DayState = "muted" | "none" | "ahead" | "done" | "today" | "todayDone";

/** State of one tally square. */
export type TallyDot = "on" | "pend" | "off";

export const WEEKLY_CAP_MINS = 120;

// ---- Kid dashboard ----

export interface TaskView {
  id: string;
  title: string;
  kind: TaskKind;
  display: TaskDisplay;
  target: number;
  reward: number; // total minutes for the whole task
  earnedMins: number; // minutes banked so far, one step at a time
  approved: number;
  pending: number;
  earned: boolean;
  dots: TallyDot[];
  barPct: number; // 0–100
}

export interface DayCell {
  w: string; // weekday letter
  n: number; // day of month
  st: DayState;
}

export interface WeekMeta {
  weekStart: string; // ISO Monday
  label: string; // "Jun 15 – 21"
  tag: string; // "This week" | "Last week" | "Next week" | "Earlier" | "Upcoming"
  state: WeekState;
}

export interface Celebration {
  ledgerId: string;
  who: string;
  mins: number;
  task: string;
}

/** An available (unused) celebration: free-text reason + id to redeem/mark used. */
export interface CelebrationItem {
  id: string;
  note: string;
}

export interface KidWeekView {
  kidId: string;
  kidName: string;
  avatarKey: AvatarKey;
  meta: WeekMeta;
  days: DayCell[];
  tasks: TaskView[];
  gained: number;
  left: number;
  redeemed: number;
  weeklyCapMins: number;
  celebrations: CelebrationItem[]; // available (unused) named celebrations
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
  prevWeekStart: string;
  nextWeekStart: string;
  celebration: Celebration | null;
}

// ---- Home ----

export interface ProfileSummary {
  id: string;
  name: string;
  avatarKey: AvatarKey;
  isKid: boolean;
  roleLabel: string;
  stat: number;
  statLabel: string;
}

// ---- Parent desk ----

export interface QueueItem {
  completionId: string;
  kidId: string;
  kidName: string;
  taskTitle: string;
  kind: TaskKind;
  stepMins: number; // minutes this one approval awards
}

export interface ParentTaskRow {
  id: string;
  title: string;
  kind: TaskKind;
  approved: number;
  target: number;
  reward: number;
  earnedMins: number;
  earned: boolean;
  barPct: number;
}

export interface ParentKidSummary {
  kidId: string;
  name: string;
  avatarKey: AvatarKey;
  gained: number;
  celebrations: CelebrationItem[];
  tasks: ParentTaskRow[];
}

export interface HistoryItem {
  who: string;
  text: string;
  amount: number; // signed
  unit: "min" | "token";
  kind: "earn" | "redeem" | "adjust" | "token" | "approval";
  time: string;
  // Present for kind "approval" — lets the parent undo an approval given by mistake.
  completionId?: string;
}

export interface ParentDeskView {
  weekLabel: string;
  queue: QueueItem[];
  kids: ParentKidSummary[];
  history: HistoryItem[];
}
