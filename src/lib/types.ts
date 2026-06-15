// Domain types for the kid's weekly view.
// Mirrors the PRD economy model: weekly task targets that award screen-time
// minutes as a lump sum once the target is hit.

export type IconName = "drums" | "guitar" | "book" | "pencil";
export type TileColor = "drums" | "book" | "maths";

/** How a task's weekly progress is shown to the kid. */
export type TaskDisplay = "tally" | "bar";

export interface Task {
  id: string;
  title: string;
  icon: IconName;
  tile: TileColor;
  display: TaskDisplay;
  /** Sessions to log (tally) or steps to fill (bar) to hit the weekly target. */
  target: number;
  /** Approved progress so far this week. */
  done: number;
  /** Minutes awarded once `done` reaches `target` (per-target-hit, lump sum). */
  rewardMins: number;
}

export interface WeekDay {
  /** Single-letter weekday label, e.g. "M". */
  label: string;
  /** Day of month, e.g. 15. */
  date: number;
  /** Whether the kid logged any activity that day (shows a dot). */
  active: boolean;
  isToday: boolean;
}

export interface KidWeek {
  kidName: string;
  /** Human label for the week, e.g. "Jun 15 – 21". */
  weekLabel: string;
  isCurrentWeek: boolean;
  days: WeekDay[];
  /** Weekly screen-time ceiling in minutes (e.g. 120 = 2 hrs). */
  weeklyCapMins: number;
  tasks: Task[];
}

/** A task has hit its weekly target (and therefore earned its minutes). */
export function isComplete(task: Task): boolean {
  return task.done >= task.target;
}

/** Total minutes earned this week = sum of rewards for completed targets. */
export function minutesGained(tasks: Task[]): number {
  return tasks.reduce((sum, t) => (isComplete(t) ? sum + t.rewardMins : sum), 0);
}
