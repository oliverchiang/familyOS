// Week-boundary logic for the screen-time economy.
// Weeks run Monday–Sunday, computed in a fixed timezone (default Europe/London)
// so awards and resets land on the correct local day regardless of server TZ.

export const DEFAULT_TIME_ZONE = "Europe/London";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Calendar year/month/day of `date` as observed in `timeZone`. */
function localYMD(date: Date, timeZone: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

function toISODate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Calendar date (YYYY-MM-DD) of `date` as observed in `timeZone`. */
export function localISODate(date: Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  const { y, m, d } = localYMD(date, timeZone);
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** ISO date (YYYY-MM-DD) of the Monday starting the week that contains `date`. */
export function weekStartISO(date: Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  const { y, m, d } = localYMD(date, timeZone);
  // Anchor at noon UTC on the local calendar date — avoids midnight/DST edges.
  const day = new Date(Date.UTC(y, m - 1, d, 12));
  const dow = day.getUTCDay(); // 0 = Sun … 6 = Sat
  const offsetToMonday = dow === 0 ? 6 : dow - 1;
  day.setUTCDate(day.getUTCDate() - offsetToMonday);
  return toISODate(day);
}

/** Human label for a week, e.g. "Jun 15 – 21" or "Jun 29 – Jul 5". */
export function formatWeekLabel(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 12));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  const startMonth = MONTHS[start.getUTCMonth()];
  const endMonth = MONTHS[end.getUTCMonth()];
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();

  return startMonth === endMonth
    ? `${startMonth} ${startDay} – ${endDay}`
    : `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
}
