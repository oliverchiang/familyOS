import { describe, expect, test } from "vitest";
import {
  canRedeem,
  computeLeft,
  gainedFromTasks,
  isTargetMet,
  screenTimeBar,
  tallyDots,
  tasksToAward,
  tokenBalance,
  weekBalanceMins,
} from "./economy";

describe("gainedFromTasks", () => {
  test("sums rewards for tasks at or over target only", () => {
    expect(
      gainedFromTasks([
        { approved: 4, target: 4, reward: 60 }, // earned
        { approved: 3, target: 5, reward: 30 }, // not earned
        { approved: 5, target: 5, reward: 30 }, // earned
      ]),
    ).toBe(90);
  });
});

describe("computeLeft", () => {
  test("left = gained - redeemed + adjust, floored at 0", () => {
    expect(computeLeft(90, 15, 0)).toBe(75);
    expect(computeLeft(90, 30, 15)).toBe(75);
    expect(computeLeft(30, 60, 0)).toBe(0); // never negative
  });
});

describe("tallyDots", () => {
  test("marks approved as on, pending as pend, rest off", () => {
    expect(tallyDots(2, 1, 4)).toEqual(["on", "on", "pend", "off"]);
  });
  test("clamps to target length", () => {
    expect(tallyDots(4, 0, 4)).toEqual(["on", "on", "on", "on"]);
  });
});

describe("isTargetMet", () => {
  test("is true when approved count reaches the target", () => {
    expect(isTargetMet(4, 4)).toBe(true);
  });
  test("is false below the target", () => {
    expect(isTargetMet(3, 4)).toBe(false);
  });
  test("stays true past the target", () => {
    expect(isTargetMet(5, 4)).toBe(true);
  });
});

describe("weekBalanceMins", () => {
  test("sums signed ledger entries", () => {
    expect(weekBalanceMins([{ minutes: 40 }, { minutes: 30 }, { minutes: -30 }])).toBe(40);
  });
  test("is zero with no entries", () => {
    expect(weekBalanceMins([])).toBe(0);
  });
});

describe("canRedeem", () => {
  test("allows redeeming up to the full balance", () => {
    expect(canRedeem(40, 30)).toBe(true);
    expect(canRedeem(40, 40)).toBe(true);
  });
  test("rejects redeeming more than the balance", () => {
    expect(canRedeem(40, 50)).toBe(false);
  });
  test("rejects non-positive amounts", () => {
    expect(canRedeem(40, 0)).toBe(false);
    expect(canRedeem(40, -5)).toBe(false);
  });
});

describe("screenTimeBar", () => {
  test("total is used + remaining; usedPct fills as time is spent", () => {
    expect(screenTimeBar(0, 90)).toEqual({ total: 90, usedPct: 0 });
    expect(screenTimeBar(30, 60)).toEqual({ total: 90, usedPct: (30 / 90) * 100 });
    expect(screenTimeBar(90, 0)).toEqual({ total: 90, usedPct: 100 });
  });
  test("is empty (no division by zero) when nothing earned", () => {
    expect(screenTimeBar(0, 0)).toEqual({ total: 0, usedPct: 0 });
  });
});

describe("tokenBalance", () => {
  test("balance = grants − revokes − redeems", () => {
    expect(
      tokenBalance([
        { event: "GRANT" },
        { event: "GRANT" },
        { event: "GRANT" },
        { event: "REVOKE" },
        { event: "REDEEM" },
      ]),
    ).toBe(1);
  });
  test("is zero with no events", () => {
    expect(tokenBalance([])).toBe(0);
  });
  test("never reported below zero", () => {
    expect(tokenBalance([{ event: "REDEEM" }, { event: "REVOKE" }])).toBe(0);
  });
});

describe("tasksToAward", () => {
  test("returns met-but-not-yet-awarded tasks only", () => {
    const candidates = [
      { taskId: "drums", approvedCount: 4, target: 4, rewardMins: 40 },
      { taskId: "chinese", approvedCount: 3, target: 5, rewardMins: 30 },
      { taskId: "maths", approvedCount: 4, target: 4, rewardMins: 30 },
    ];
    const result = tasksToAward(candidates, new Set(["maths"]));
    expect(result.map((t) => t.taskId)).toEqual(["drums"]);
  });
});
