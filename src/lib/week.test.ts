import { describe, expect, test } from "vitest";
import {
  dayCellState,
  formatWeekLabel,
  localISODate,
  relativeWeek,
  weekStartISO,
} from "./week";

describe("relativeWeek", () => {
  const cur = "2026-06-15";
  test("classifies current / last / next week", () => {
    expect(relativeWeek(cur, cur)).toEqual({ state: "current", tag: "This week" });
    expect(relativeWeek("2026-06-08", cur)).toEqual({ state: "past", tag: "Last week" });
    expect(relativeWeek("2026-06-22", cur)).toEqual({ state: "future", tag: "Next week" });
  });
  test("labels distant weeks generically", () => {
    expect(relativeWeek("2026-06-01", cur)).toEqual({ state: "past", tag: "Earlier" });
    expect(relativeWeek("2026-06-29", cur)).toEqual({ state: "future", tag: "Upcoming" });
  });
});

describe("dayCellState", () => {
  test("future week is always muted", () => {
    expect(dayCellState("future", 0, -1, true)).toBe("muted");
  });
  test("past week reflects activity", () => {
    expect(dayCellState("past", 3, -1, true)).toBe("done");
    expect(dayCellState("past", 3, -1, false)).toBe("none");
  });
  test("current week: before today, today, and ahead", () => {
    expect(dayCellState("current", 1, 3, true)).toBe("done");
    expect(dayCellState("current", 1, 3, false)).toBe("none");
    expect(dayCellState("current", 3, 3, true)).toBe("todayDone");
    expect(dayCellState("current", 3, 3, false)).toBe("today");
    expect(dayCellState("current", 5, 3, false)).toBe("ahead");
  });
});

describe("localISODate", () => {
  test("returns the calendar date observed in the timezone", () => {
    // Sunday 23:30 UTC is Monday 00:30 in London (BST).
    expect(localISODate(new Date("2026-06-14T23:30:00Z"), "Europe/London")).toBe(
      "2026-06-15",
    );
  });
});

describe("weekStartISO", () => {
  test("returns the Monday of a midweek date", () => {
    // Wednesday 2026-06-17 (noon UTC) → Monday 2026-06-15
    expect(weekStartISO(new Date("2026-06-17T12:00:00Z"))).toBe("2026-06-15");
  });

  test("returns the same date when given a Monday", () => {
    expect(weekStartISO(new Date("2026-06-15T12:00:00Z"))).toBe("2026-06-15");
  });

  test("treats Sunday as the last day of the week (Mon–Sun)", () => {
    // Sunday noon NZ (2026-06-21T00:00Z, UTC+12) → still the week starting Monday 2026-06-15
    expect(weekStartISO(new Date("2026-06-21T00:00:00Z"))).toBe("2026-06-15");
  });

  test("uses the target timezone, not UTC, to decide the day", () => {
    // Sunday 23:30 UTC is already Monday 00:30 in London (BST, UTC+1),
    // so the week should start on that Monday.
    expect(weekStartISO(new Date("2026-06-14T23:30:00Z"), "Europe/London")).toBe(
      "2026-06-15",
    );
  });
});

describe("formatWeekLabel", () => {
  test("formats a same-month week", () => {
    expect(formatWeekLabel("2026-06-15")).toBe("Jun 15 – 21");
  });

  test("formats a week spanning two months", () => {
    expect(formatWeekLabel("2026-06-29")).toBe("Jun 29 – Jul 5");
  });
});
