import { describe, expect, test } from "vitest";
import { formatWeekLabel, localISODate, weekStartISO } from "./week";

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
    // Sunday 2026-06-21 → still the week starting Monday 2026-06-15
    expect(weekStartISO(new Date("2026-06-21T12:00:00Z"))).toBe("2026-06-15");
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
