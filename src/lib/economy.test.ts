import { describe, expect, test } from "vitest";
import { canRedeem, isTargetMet, tasksToAward, weekBalanceMins } from "./economy";

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
