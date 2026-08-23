import { describe, expect, test } from "vitest";
import {
  canRedeem,
  cappedGain,
  computeLeft,
  earnedForSteps,
  gainedFromTasks,
  isTargetMet,
  plannedAwards,
  screenTimeBar,
  stepAward,
  tallyDots,
  weekBalanceMins,
} from "./economy";

describe("earnedForSteps", () => {
  test("pays out pro-rata as steps are approved", () => {
    expect(earnedForSteps(0, 4, 60)).toBe(0);
    expect(earnedForSteps(1, 4, 60)).toBe(15);
    expect(earnedForSteps(3, 4, 60)).toBe(45);
  });
  test("pays exactly the full reward at the target", () => {
    expect(earnedForSteps(4, 4, 60)).toBe(60);
    expect(earnedForSteps(5, 5, 30)).toBe(30);
  });
  test("never pays beyond the target", () => {
    expect(earnedForSteps(7, 4, 60)).toBe(60);
  });
  test("rounds down mid-task so an uneven reward still totals exactly", () => {
    // reward 10 over 3 steps: 3.33/step → 3, 6, 10
    expect(earnedForSteps(1, 3, 10)).toBe(3);
    expect(earnedForSteps(2, 3, 10)).toBe(6);
    expect(earnedForSteps(3, 3, 10)).toBe(10);
  });
  test("is zero for a task with no target", () => {
    expect(earnedForSteps(2, 0, 60)).toBe(0);
  });
});

describe("stepAward", () => {
  test("splits an even reward equally across steps", () => {
    expect([1, 2, 3, 4].map((n) => stepAward(n, 4, 60))).toEqual([15, 15, 15, 15]);
  });
  test("puts the rounding remainder on the final step", () => {
    expect([1, 2, 3].map((n) => stepAward(n, 3, 10))).toEqual([3, 3, 4]);
  });
  test("awards nothing for steps past the target", () => {
    expect(stepAward(5, 4, 60)).toBe(0);
    expect(stepAward(0, 4, 60)).toBe(0);
  });
});

describe("gainedFromTasks", () => {
  test("sums each task's pro-rata earnings, not just finished tasks", () => {
    expect(
      gainedFromTasks([
        { approved: 4, target: 4, reward: 60 }, // finished → 60
        { approved: 3, target: 5, reward: 30 }, // part done → 18
        { approved: 5, target: 5, reward: 30 }, // finished → 30
      ]),
    ).toBe(108);
  });
  test("ignores steps logged past a task's target", () => {
    expect(gainedFromTasks([{ approved: 9, target: 4, reward: 60 }])).toBe(60);
  });
});

describe("plannedAwards", () => {
  const task = { taskId: "drums", target: 4, reward: 60 };

  test("gives every approved step its own award, in approval order", () => {
    expect(plannedAwards(task, ["c1", "c2", "c3"])).toEqual([
      { completionId: "c1", taskId: "drums", minutes: 15 },
      { completionId: "c2", taskId: "drums", minutes: 15 },
      { completionId: "c3", taskId: "drums", minutes: 15 },
    ]);
  });
  test("plans nothing when no step is approved", () => {
    expect(plannedAwards(task, [])).toEqual([]);
  });
  test("drops steps beyond the target so they earn nothing", () => {
    expect(plannedAwards(task, ["c1", "c2", "c3", "c4", "c5"]).map((a) => a.completionId)).toEqual([
      "c1",
      "c2",
      "c3",
      "c4",
    ]);
  });
  test("planned minutes sum to the task's reward once finished", () => {
    const total = plannedAwards({ taskId: "t", target: 3, reward: 10 }, ["a", "b", "c"]).reduce(
      (sum, a) => sum + a.minutes,
      0,
    );
    expect(total).toBe(10);
  });
});

describe("cappedGain", () => {
  test("caps task earnings at the weekly ceiling", () => {
    expect(cappedGain(210, 120)).toBe(120);
    expect(cappedGain(120, 120)).toBe(120);
    expect(cappedGain(80, 120)).toBe(80);
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

